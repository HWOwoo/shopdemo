package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.order.CreateOrderRequest;
import shop.inst.shopdemo.dto.order.OrderItemResponse;
import shop.inst.shopdemo.dto.order.OrderResponse;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.GoodsOption;
import shop.inst.shopdemo.entity.Order;
import shop.inst.shopdemo.entity.OrderItem;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.OrderStatus;
import shop.inst.shopdemo.entity.enums.PurchaseType;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.GoodsOptionRepository;
import shop.inst.shopdemo.repository.GoodsRepository;
import shop.inst.shopdemo.repository.OrderRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final GoodsRepository goodsRepository;
    private final GoodsOptionRepository goodsOptionRepository;
    private final UserRepository userRepository;

    @Transactional
    public OrderResponse createOrder(String buyerUsername, Long goodsId, CreateOrderRequest req) {
        User buyer = userRepository.findByUsername(buyerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Goods goods = goodsRepository.findById(goodsId)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + goodsId));

        if (goods.getStatus() != GoodsStatus.APPROVED) {
            throw new BadRequestException("구매할 수 없는 상품입니다.");
        }

        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new BadRequestException("주문 항목이 없습니다.");
        }

        PurchaseType purchaseType = PurchaseType.valueOf(
                req.getPurchaseType() != null ? req.getPurchaseType() : "DIRECT"
        );

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .goods(goods)
                .buyer(buyer)
                .purchaseType(purchaseType)
                .paymentMethod(req.getPaymentMethod())
                .depositorName(req.getDepositorName())
                .depositorDate(req.getDepositorDate())
                .ordererName(req.getOrdererName())
                .ordererEmail(req.getOrdererEmail())
                .ordererPhone(req.getOrdererPhone())
                .recipientName(req.getRecipientName())
                .recipientPhone(req.getRecipientPhone())
                .postalCode(req.getPostalCode())
                .address(req.getAddress())
                .addressDetail(req.getAddressDetail())
                .deliveryMemo(req.getDeliveryMemo())
                .totalPrice(req.getTotalPrice())
                .build();

        // OrderItem 생성 + 재고 차감
        for (var itemReq : req.getItems()) {
            if (itemReq.getQuantity() <= 0) continue;
            GoodsOption option = goodsOptionRepository.findById(itemReq.getOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Option not found: " + itemReq.getOptionId()));
            // 재고 검사 (null = 무제한)
            if (option.getStock() != null && option.getStock() < itemReq.getQuantity()) {
                throw new BadRequestException("'" + option.getName() + "' 재고가 부족합니다. (남은 재고: " + option.getStock() + "개)");
            }
            // 재고 차감
            if (option.getStock() != null) {
                option.setStock(option.getStock() - itemReq.getQuantity());
                goodsOptionRepository.save(option);
            }
            OrderItem item = OrderItem.builder()
                    .order(order)
                    .option(option)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(option.getPrice())
                    .build();
            order.getItems().add(item);
        }

        if (order.getItems().isEmpty()) {
            throw new BadRequestException("수량이 1개 이상인 항목이 없습니다.");
        }

        // 모든 유한 재고 옵션이 0이 되면 자동 품절 처리
        deductGoodsStock(goods);

        return toResponse(orderRepository.save(order));
    }

    // 판매자: 내 굿즈에 들어온 주문 목록
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForSeller(String sellerUsername) {
        User seller = userRepository.findByUsername(sellerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByGoodsSeller(seller).stream()
                .map(this::toResponse)
                .toList();
    }

    // 구매자: 특정 굿즈에 대한 내 주문 이력
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrdersForGoods(String buyerUsername, Long goodsId) {
        User buyer = userRepository.findByUsername(buyerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByBuyerAndGoodsIdOrderByCreatedAtDesc(buyer, goodsId).stream()
                .map(this::toResponse)
                .toList();
    }

    // 구매자: 내 구매 내역
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForBuyer(String buyerUsername) {
        User buyer = userRepository.findByUsername(buyerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByBuyerOrderByCreatedAtDesc(buyer).stream()
                .map(this::toResponse)
                .toList();
    }

    // 판매자: 입금 확인
    @Transactional
    public OrderResponse confirmPayment(String sellerUsername, Long orderId) {
        Order order = getOrderOwnedBySeller(sellerUsername, orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("이미 처리된 주문입니다.");
        }
        order.setStatus(OrderStatus.PAYMENT_CONFIRMED);
        return toResponse(orderRepository.save(order));
    }

    // 판매자: 주문 취소
    @Transactional
    public OrderResponse cancelOrder(String sellerUsername, Long orderId) {
        Order order = getOrderOwnedBySeller(sellerUsername, orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("이미 취소된 주문입니다.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    // 판매자: 송장 등록 → SHIPPED 전환
    @Transactional
    public OrderResponse updateTracking(String sellerUsername, Long orderId, String courierName, String trackingNumber) {
        Order order = getOrderOwnedBySeller(sellerUsername, orderId);
        if (order.getStatus() != OrderStatus.PAYMENT_CONFIRMED) {
            throw new BadRequestException("입금 확인된 주문만 송장을 등록할 수 있습니다.");
        }
        order.setCourierName(courierName);
        order.setTrackingNumber(trackingNumber);
        order.setStatus(OrderStatus.SHIPPED);
        return toResponse(orderRepository.save(order));
    }

    // 구매자: 수령 확인 → DELIVERED 전환
    @Transactional
    public OrderResponse confirmDelivery(String buyerUsername, Long orderId) {
        Order order = getOrderOwnedByBuyer(buyerUsername, orderId);
        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new BadRequestException("배송 중인 주문만 수령 확인할 수 있습니다.");
        }
        order.setStatus(OrderStatus.DELIVERED);
        return toResponse(orderRepository.save(order));
    }

    // 구매자: 주문 취소 (입금 대기 또는 입금 확인 상태에서만 가능)
    @Transactional
    public OrderResponse cancelOrderByBuyer(String buyerUsername, Long orderId) {
        Order order = getOrderOwnedByBuyer(buyerUsername, orderId);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT
                && order.getStatus() != OrderStatus.PAYMENT_CONFIRMED) {
            throw new BadRequestException("배송이 시작된 주문은 취소할 수 없습니다.");
        }
        order.setStatus(OrderStatus.CANCELLED);
        restoreStock(order);
        return toResponse(orderRepository.save(order));
    }

    private Order getOrderOwnedByBuyer(String buyerUsername, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("주문을 찾을 수 없습니다."));
        if (!order.getBuyer().getUsername().equals(buyerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        return order;
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            GoodsOption option = item.getOption();
            if (option.getStock() != null) {
                option.setStock(option.getStock() + item.getQuantity());
                goodsOptionRepository.save(option);
            }
        }
        Goods goods = order.getGoods();
        if (goods.getStatus() == GoodsStatus.SOLDOUT) {
            goods.setStatus(GoodsStatus.APPROVED);
            goods.setManualSoldOut(false);
        }
        deductGoodsStock(goods); // stock 합계 재계산
    }

    private Order getOrderOwnedBySeller(String sellerUsername, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("주문을 찾을 수 없습니다."));
        if (!order.getGoods().getSeller().getUsername().equals(sellerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        return order;
    }

    private void deductGoodsStock(Goods goods) {
        List<GoodsOption> options = goods.getOptions();
        // 유한 재고 옵션들의 합계 재계산
        boolean hasUnlimited = options.stream().anyMatch(o -> o.getStock() == null);
        int total = hasUnlimited ? Integer.MAX_VALUE
                : options.stream().mapToInt(GoodsOption::getStock).sum();
        goods.setStock(total);

        // 모든 옵션이 유한 재고이고 합계가 0이면 자동 SOLDOUT
        if (!hasUnlimited && total == 0 && goods.getStatus() == GoodsStatus.APPROVED) {
            goods.setStatus(GoodsStatus.SOLDOUT);
        }
        goodsRepository.save(goods);
    }

    private String generateOrderNumber() {
        String candidate;
        do {
            String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            candidate = uuid.substring(0, 6) + "-" + uuid.substring(6);
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }

    public OrderResponse toResponse(Order o) {
        List<OrderItemResponse> itemResponses = o.getItems().stream()
                .map(i -> OrderItemResponse.builder()
                        .optionId(i.getOption().getId())
                        .optionName(i.getOption().getName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .subtotal(i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                        .build())
                .toList();

        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .goodsId(o.getGoods().getId())
                .goodsName(o.getGoods().getName())
                .items(itemResponses)
                .buyerId(o.getBuyer().getId())
                .buyerUsername(o.getBuyer().getUsername())
                .status(o.getStatus())
                .purchaseType(o.getPurchaseType())
                .paymentMethod(o.getPaymentMethod())
                .depositorName(o.getDepositorName())
                .depositorDate(o.getDepositorDate())
                .ordererName(o.getOrdererName())
                .ordererEmail(o.getOrdererEmail())
                .ordererPhone(o.getOrdererPhone())
                .recipientName(o.getRecipientName())
                .recipientPhone(o.getRecipientPhone())
                .postalCode(o.getPostalCode())
                .address(o.getAddress())
                .addressDetail(o.getAddressDetail())
                .deliveryMemo(o.getDeliveryMemo())
                .totalPrice(o.getTotalPrice())
                .courierName(o.getCourierName())
                .trackingNumber(o.getTrackingNumber())
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
