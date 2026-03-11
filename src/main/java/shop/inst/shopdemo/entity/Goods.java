package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "goods")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Goods {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    /** 재고 수량 */
    @Column(nullable = false)
    private Integer stock;

    /** 배송비 (0 = 무료배송) */
    @Column(nullable = false)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    private String imageUrl;

    /** 결제 수단 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType paymentType;

    /** 계좌이체 정보 (paymentType = BANK_TRANSFER 일 때만 사용) */
    private String bankName;
    private String bankAccount;
    private String bankAccountHolder;

    /** 판매 유형 (통판 / 사전수요조사) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'SALE'")
    @Builder.Default
    private GoodsType goodsType = GoodsType.SALE;

    @Column(nullable = false)
    private Boolean requiresCopyrightPermission;

    private String rightsHolderEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GoodsStatus status;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Builder.Default
    private Boolean copyrightEmailSent = false;

    /** 판매 옵션 목록 (가격/재고 per option) */
    @OneToMany(mappedBy = "goods", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    @Builder.Default
    private List<GoodsOption> options = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
