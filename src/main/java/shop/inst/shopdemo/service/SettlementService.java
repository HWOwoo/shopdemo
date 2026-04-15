package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.settlement.CreateSettlementRequest;
import shop.inst.shopdemo.dto.settlement.SettlementResponse;
import shop.inst.shopdemo.entity.Order;
import shop.inst.shopdemo.entity.Settlement;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.SettlementStatus;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.OrderRepository;
import shop.inst.shopdemo.repository.SettlementRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** 어드민: 정산 내역 생성 */
    @Transactional
    public SettlementResponse createSettlement(CreateSettlementRequest request) {
        if (request.getPeriodStart().isAfter(request.getPeriodEnd())) {
            throw new BadRequestException("시작일이 종료일보다 이후일 수 없습니다.");
        }

        User seller = userRepository.findById(request.getSellerId())
                .orElseThrow(() -> new ResourceNotFoundException("판매자를 찾을 수 없습니다."));

        LocalDateTime start = request.getPeriodStart().atStartOfDay();
        LocalDateTime end = request.getPeriodEnd().plusDays(1).atStartOfDay();

        List<Order> deliveredOrders = orderRepository.findDeliveredOrdersBySellerAndPeriod(seller, start, end);
        if (deliveredOrders.isEmpty()) {
            throw new BadRequestException("해당 기간에 배송 완료된 주문이 없습니다.");
        }

        BigDecimal totalAmount = deliveredOrders.stream()
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Settlement settlement = Settlement.builder()
                .seller(seller)
                .amount(totalAmount)
                .orderCount(deliveredOrders.size())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .build();

        Settlement saved = settlementRepository.save(settlement);

        notificationService.create(
                seller,
                shop.inst.shopdemo.entity.enums.NotificationType.PAYMENT_CONFIRMED,
                "정산 내역이 생성되었습니다",
                "정산 금액: " + totalAmount.toPlainString() + "원 (" + deliveredOrders.size() + "건)",
                null, null
        );

        return toResponse(saved);
    }

    /** 어드민: 정산 완료 처리 */
    @Transactional
    public SettlementResponse markAsPaid(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("정산 내역을 찾을 수 없습니다."));
        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new BadRequestException("이미 정산 완료된 건입니다.");
        }
        settlement.setStatus(SettlementStatus.PAID);
        settlement.setPaidAt(LocalDateTime.now());
        Settlement saved = settlementRepository.save(settlement);

        notificationService.create(
                settlement.getSeller(),
                shop.inst.shopdemo.entity.enums.NotificationType.PAYMENT_CONFIRMED,
                "정산이 완료되었습니다",
                "정산 금액 " + settlement.getAmount().toPlainString() + "원이 지급되었습니다.",
                null, null
        );

        return toResponse(saved);
    }

    /** 어드민: 전체 정산 목록 */
    @Transactional(readOnly = true)
    public List<SettlementResponse> getAllSettlements() {
        return settlementRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    /** 판매자: 내 정산 목록 */
    @Transactional(readOnly = true)
    public List<SettlementResponse> getMySettlements(String sellerUsername) {
        User seller = userRepository.findByUsername(sellerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return settlementRepository.findBySellerOrderByCreatedAtDesc(seller).stream()
                .map(this::toResponse)
                .toList();
    }

    private SettlementResponse toResponse(Settlement s) {
        return SettlementResponse.builder()
                .id(s.getId())
                .sellerId(s.getSeller().getId())
                .sellerUsername(s.getSeller().getUsername())
                .amount(s.getAmount())
                .orderCount(s.getOrderCount())
                .periodStart(s.getPeriodStart())
                .periodEnd(s.getPeriodEnd())
                .status(s.getStatus())
                .paidAt(s.getPaidAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
