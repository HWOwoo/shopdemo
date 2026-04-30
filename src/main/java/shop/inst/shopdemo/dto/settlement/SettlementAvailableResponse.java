package shop.inst.shopdemo.dto.settlement;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/** 판매자가 신청 가능한 정산 누적분 */
@Data
@Builder
public class SettlementAvailableResponse {
    /** 미정산 배송완료 주문 합계 */
    private BigDecimal amount;
    /** 미정산 주문 건수 */
    private Integer orderCount;
    /** 가장 오래된 주문 배송완료일 (null = 신청 가능 주문 없음) */
    private LocalDate oldestOrderDate;
    /** 가장 최근 주문 배송완료일 */
    private LocalDate latestOrderDate;
    /** 이미 신청해서 검토 중(REQUESTED)인 정산이 있는지 */
    private boolean hasPendingRequest;
}
