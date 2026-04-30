package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.settlement.CreateSettlementRequest;
import shop.inst.shopdemo.dto.settlement.SettlementAvailableResponse;
import shop.inst.shopdemo.dto.settlement.SettlementResponse;
import shop.inst.shopdemo.entity.Order;
import shop.inst.shopdemo.entity.Settlement;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.NotificationType;
import shop.inst.shopdemo.entity.enums.Role;
import shop.inst.shopdemo.entity.enums.SettlementStatus;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.OrderRepository;
import shop.inst.shopdemo.repository.SettlementRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** 어드민: 정산 내역 직접 생성 (PENDING 상태로) */
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
            throw new BadRequestException("해당 기간에 배송 완료된 미정산 주문이 없습니다.");
        }

        Settlement saved = persistSettlement(seller, deliveredOrders,
                request.getPeriodStart(), request.getPeriodEnd(),
                SettlementStatus.PENDING, null);

        notificationService.create(
                seller,
                NotificationType.SETTLEMENT_APPROVED,
                "정산 내역이 생성되었습니다",
                "정산 금액: " + saved.getAmount().toPlainString() + "원 (" + saved.getOrderCount() + "건)",
                null, null
        );

        return toResponse(saved);
    }

    /** 판매자: 신청 가능한 정산 누적분 조회 */
    @Transactional(readOnly = true)
    public SettlementAvailableResponse getAvailable(String sellerUsername) {
        User seller = findUser(sellerUsername);
        List<Order> orders = orderRepository.findUnsettledDeliveredOrdersBySeller(seller);
        boolean hasPending = settlementRepository.existsBySellerAndStatus(seller, SettlementStatus.REQUESTED);

        if (orders.isEmpty()) {
            return SettlementAvailableResponse.builder()
                    .amount(BigDecimal.ZERO)
                    .orderCount(0)
                    .hasPendingRequest(hasPending)
                    .build();
        }

        BigDecimal total = orders.stream().map(Order::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate oldest = orders.stream().map(o -> o.getUpdatedAt().toLocalDate()).min(Comparator.naturalOrder()).orElse(null);
        LocalDate latest = orders.stream().map(o -> o.getUpdatedAt().toLocalDate()).max(Comparator.naturalOrder()).orElse(null);

        return SettlementAvailableResponse.builder()
                .amount(total)
                .orderCount(orders.size())
                .oldestOrderDate(oldest)
                .latestOrderDate(latest)
                .hasPendingRequest(hasPending)
                .build();
    }

    /** 판매자: 정산 신청 (미정산 누적분 일괄) */
    @Transactional
    public SettlementResponse requestSettlement(String sellerUsername) {
        User seller = findUser(sellerUsername);

        if (settlementRepository.existsBySellerAndStatus(seller, SettlementStatus.REQUESTED)) {
            throw new BadRequestException("이미 검토 중인 정산 신청이 있습니다.");
        }

        List<Order> orders = orderRepository.findUnsettledDeliveredOrdersBySeller(seller);
        if (orders.isEmpty()) {
            throw new BadRequestException("신청 가능한 미정산 주문이 없습니다.");
        }

        LocalDate periodStart = orders.stream().map(o -> o.getUpdatedAt().toLocalDate()).min(Comparator.naturalOrder()).orElseThrow();
        LocalDate periodEnd = orders.stream().map(o -> o.getUpdatedAt().toLocalDate()).max(Comparator.naturalOrder()).orElseThrow();

        Settlement saved = persistSettlement(seller, orders, periodStart, periodEnd,
                SettlementStatus.REQUESTED, LocalDateTime.now());

        // 어드민 전원에게 알림
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .forEach(admin -> notificationService.create(
                        admin,
                        NotificationType.SETTLEMENT_REQUESTED,
                        "정산 신청이 접수되었습니다",
                        seller.getUsername() + " | "
                                + saved.getAmount().toPlainString() + "원 ("
                                + saved.getOrderCount() + "건)",
                        null, null
                ));

        return toResponse(saved);
    }

    /** 어드민: 정산 신청 승인 (REQUESTED → PENDING) */
    @Transactional
    public SettlementResponse approveRequest(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("정산 내역을 찾을 수 없습니다."));
        if (settlement.getStatus() != SettlementStatus.REQUESTED) {
            throw new BadRequestException("신청 검토 중인 정산만 승인할 수 있습니다.");
        }
        settlement.setStatus(SettlementStatus.PENDING);
        Settlement saved = settlementRepository.save(settlement);

        notificationService.create(
                settlement.getSeller(),
                NotificationType.SETTLEMENT_APPROVED,
                "정산 신청이 승인되었습니다",
                "정산 금액 " + settlement.getAmount().toPlainString() + "원 송금 대기 중입니다.",
                null, null
        );

        return toResponse(saved);
    }

    /** 어드민: 정산 신청 거절 (REQUESTED → REJECTED, 주문 연결 해제) */
    @Transactional
    public SettlementResponse rejectRequest(Long settlementId, String reason) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("정산 내역을 찾을 수 없습니다."));
        if (settlement.getStatus() != SettlementStatus.REQUESTED) {
            throw new BadRequestException("신청 검토 중인 정산만 거절할 수 있습니다.");
        }

        // 주문 연결 해제 → 다시 신청 가능
        List<Order> linked = orderRepository.findBySettlementId(settlementId);
        linked.forEach(o -> o.setSettlement(null));
        orderRepository.saveAll(linked);

        settlement.setStatus(SettlementStatus.REJECTED);
        settlement.setRejectedAt(LocalDateTime.now());
        settlement.setRejectedReason(reason);
        Settlement saved = settlementRepository.save(settlement);

        notificationService.create(
                settlement.getSeller(),
                NotificationType.SETTLEMENT_REJECTED,
                "정산 신청이 거절되었습니다",
                "사유: " + reason,
                null, null
        );

        return toResponse(saved);
    }

    /** 어드민: 정산 완료 처리 */
    @Transactional
    public SettlementResponse markAsPaid(Long settlementId) {
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("정산 내역을 찾을 수 없습니다."));
        if (settlement.getStatus() != SettlementStatus.PENDING) {
            throw new BadRequestException("송금 대기(PENDING) 상태의 정산만 완료 처리할 수 있습니다.");
        }
        settlement.setStatus(SettlementStatus.PAID);
        settlement.setPaidAt(LocalDateTime.now());
        Settlement saved = settlementRepository.save(settlement);

        notificationService.create(
                settlement.getSeller(),
                NotificationType.SETTLEMENT_PAID,
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
        User seller = findUser(sellerUsername);
        return settlementRepository.findBySellerOrderByCreatedAtDesc(seller).stream()
                .map(this::toResponse)
                .toList();
    }

    private Settlement persistSettlement(User seller, List<Order> orders,
                                         LocalDate periodStart, LocalDate periodEnd,
                                         SettlementStatus status, LocalDateTime requestedAt) {
        BigDecimal totalAmount = orders.stream()
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Settlement settlement = Settlement.builder()
                .seller(seller)
                .amount(totalAmount)
                .orderCount(orders.size())
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .status(status)
                .requestedAt(requestedAt)
                .build();

        Settlement saved = settlementRepository.save(settlement);

        // 주문 잠금: 같은 주문이 다른 정산에 다시 묶이지 않도록
        orders.forEach(o -> o.setSettlement(saved));
        orderRepository.saveAll(orders);

        return saved;
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
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
                .requestedAt(s.getRequestedAt())
                .paidAt(s.getPaidAt())
                .rejectedAt(s.getRejectedAt())
                .rejectedReason(s.getRejectedReason())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
