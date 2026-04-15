package shop.inst.shopdemo.dto.goods;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateGoodsRequest {

    /** 판매 유형 (SALE: 통판, PREORDER: 사전수요조사). 기본값 SALE */
    @NotNull
    private GoodsType goodsType;

    @NotBlank
    @Size(max = 200)
    private String name;

    @Size(max = 50000, message = "상품 설명은 50000자 이내로 작성해주세요.")
    private String description;

    @NotEmpty
    @Valid
    private List<GoodsOptionRequest> options;

    @NotNull
    @DecimalMin("0")
    private BigDecimal deliveryFee;

    /** 결제 수단 */
    @NotNull
    private PaymentType paymentType;

    /** 계좌이체 정보 (paymentType = BANK_TRANSFER 시 필수) */
    private String bankName;
    private String bankAccount;
    private String bankAccountHolder;

    @NotNull
    private Boolean requiresCopyrightPermission;

    @Email
    private String rightsHolderEmail;

    /** 사전수요조사 마감일 (PREORDER 타입에서만 사용) */
    private LocalDateTime preorderDeadline;

    /** 카테고리 */
    private String category;

    /** 태그 (콤마 구분) */
    private String tags;

    /** 추가 이미지 URL 목록 (최대 5장) */
    @Size(max = 5, message = "추가 이미지는 최대 5장까지 등록할 수 있습니다.")
    private List<String> additionalImages;
}
