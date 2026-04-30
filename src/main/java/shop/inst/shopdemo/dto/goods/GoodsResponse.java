package shop.inst.shopdemo.dto.goods;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsResponse {
    private Long id;
    private GoodsType goodsType;
    private String name;
    private String description;

    /** 카드 표시용 최저가 (옵션 중 최솟값) */
    private BigDecimal price;

    /** 옵션 목록 */
    private List<GoodsOptionResponse> options;

    /** 모든 옵션 재고가 0이거나 수동 품절 처리 시 true */
    private boolean soldOut;
    private boolean manualSoldOut;

    private BigDecimal deliveryFee;

    private PaymentType paymentType;
    private String bankName;
    private String bankAccount;
    private String bankAccountHolder;

    private Boolean requiresCopyrightPermission;
    private String rightsHolderEmail;
    private GoodsStatus status;
    private String rejectionReason;
    private Long sellerId;
    private String sellerUsername;

    /** 사전수요조사 마감일 */
    private LocalDateTime preorderDeadline;

    /** 수요조사 신청 인원 수 */
    private Long preorderCount;

    /** 카테고리 */
    private String category;

    /** 태그 (콤마 구분) */
    private String tags;

    /** 추가 이미지 URL 목록 */
    private List<String> additionalImages;

    /** 평균 평점 (리뷰 없으면 null) */
    private Double averageRating;

    /** 리뷰 개수 */
    private Long reviewCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
