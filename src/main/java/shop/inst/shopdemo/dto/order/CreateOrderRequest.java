package shop.inst.shopdemo.dto.order;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateOrderRequest {
    private Long optionId;
    private String optionName;
    private String purchaseType;   // "DIRECT" | "PLATFORM"
    private String paymentMethod;  // 중개구매 결제수단

    // 입금자 정보 (직접구매)
    private String depositorName;
    private String depositorDate;

    // 주문자
    private String ordererName;
    private String ordererEmail;
    private String ordererPhone;

    // 배송지
    private String recipientName;
    private String recipientPhone;
    private String postalCode;
    private String address;
    private String addressDetail;
    private String deliveryMemo;

    private BigDecimal totalPrice;
}
