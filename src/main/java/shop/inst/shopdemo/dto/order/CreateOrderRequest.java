package shop.inst.shopdemo.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateOrderRequest {

    @NotEmpty(message = "주문 항목을 입력해주세요.")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank(message = "구매 유형을 입력해주세요.")
    private String purchaseType;   // "DIRECT" | "PLATFORM"

    private String paymentMethod;  // 중개구매 결제수단

    // 입금자 정보 (직접구매)
    private String depositorName;
    private String depositorDate;

    // 주문자
    @NotBlank(message = "주문자 이름을 입력해주세요.")
    private String ordererName;

    @NotBlank(message = "주문자 이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String ordererEmail;

    @NotBlank(message = "주문자 연락처를 입력해주세요.")
    @Pattern(regexp = "^[0-9\\-]{10,13}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String ordererPhone;

    // 배송지
    @NotBlank(message = "수령인 이름을 입력해주세요.")
    private String recipientName;

    @NotBlank(message = "수령인 연락처를 입력해주세요.")
    @Pattern(regexp = "^[0-9\\-]{10,13}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String recipientPhone;

    @NotBlank(message = "우편번호를 입력해주세요.")
    @Pattern(regexp = "^[0-9]{5}$", message = "우편번호는 5자리 숫자여야 합니다.")
    private String postalCode;

    @NotBlank(message = "주소를 입력해주세요.")
    private String address;

    private String addressDetail;
    private String deliveryMemo;

    @NotNull(message = "총 금액을 입력해주세요.")
    private BigDecimal totalPrice;
}
