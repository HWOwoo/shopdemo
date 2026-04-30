package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import shop.inst.shopdemo.entity.enums.SettlementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    /** 정산 금액 */
    @Column(nullable = false)
    private BigDecimal amount;

    /** 정산 대상 주문 수 */
    @Column(nullable = false)
    private Integer orderCount;

    /** 정산 기간 시작일 */
    @Column(nullable = false)
    private LocalDate periodStart;

    /** 정산 기간 종료일 */
    @Column(nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SettlementStatus status = SettlementStatus.PENDING;

    /** 판매자 신청 시각 (어드민 직접 생성 건은 null) */
    private LocalDateTime requestedAt;

    /** 정산 완료일 */
    private LocalDateTime paidAt;

    /** 거절 시각 */
    private LocalDateTime rejectedAt;

    /** 거절 사유 */
    @Column(length = 500)
    private String rejectedReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
