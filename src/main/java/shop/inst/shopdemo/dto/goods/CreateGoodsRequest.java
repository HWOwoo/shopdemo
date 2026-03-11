package shop.inst.shopdemo.dto.goods;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.PaymentType;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateGoodsRequest {

    /** 판매 유형 (SALE: 통판, PREORDER: 사전수요조사). 기본값 SALE */
    @NotNull
    private GoodsType goodsType;

    @NotBlank
    @Size(max = 200)
    private String name;

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
}
