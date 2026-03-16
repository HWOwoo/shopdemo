package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.order.CreateOrderRequest;
import shop.inst.shopdemo.dto.order.OrderResponse;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.GoodsOption;
import shop.inst.shopdemo.entity.Order;
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

        GoodsOption option = null;
        if (req.getOptionId() != null) {
            option = goodsOptionRepository.findById(req.getOptionId())
                    .orElse(null);
        }

        PurchaseType purchaseType = PurchaseType.valueOf(
                req.getPurchaseType() != null ? req.getPurchaseType() : "DIRECT"
        );

        String orderNumber = generateOrderNumber();

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .goods(goods)
                .option(option)
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

    private Order getOrderOwnedBySeller(String sellerUsername, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("주문을 찾을 수 없습니다."));
        if (!order.getGoods().getSeller().getUsername().equals(sellerUsername)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        return order;
    }

    private String generateOrderNumber() {
        String candidate;
        do {
            String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            candidate = uuid.substring(0, 6) + "-" + uuid.substring(6);
        } while (orderRepository.existsByOrderNumber(candidate));
        return candidate;
    }

    private OrderResponse toResponse(Order o) {
        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .goodsId(o.getGoods().getId())
                .goodsName(o.getGoods().getName())
                .optionName(o.getOption() != null ? o.getOption().getName() : null)
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
                .createdAt(o.getCreatedAt())
                .updatedAt(o.getUpdatedAt())
                .build();
    }
}
