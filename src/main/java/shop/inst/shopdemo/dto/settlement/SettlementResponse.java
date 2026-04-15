package shop.inst.shopdemo.dto.settlement;

import lombok.Builder;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.SettlementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SettlementResponse {
    private Long id;
    private Long sellerId;
    private String sellerUsername;
    private BigDecimal amount;
    private Integer orderCount;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private SettlementStatus status;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
}
