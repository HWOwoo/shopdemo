package shop.inst.shopdemo.dto.order;

import lombok.Builder;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.OrderStatus;
import shop.inst.shopdemo.entity.enums.PurchaseType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;

    private Long goodsId;
    private String goodsName;
    private String optionName;

    private Long buyerId;
    private String buyerUsername;

    private OrderStatus status;
    private PurchaseType purchaseType;
    private String paymentMethod;

    private String depositorName;
    private String depositorDate;
    private String ordererName;
    private String ordererEmail;
    private String ordererPhone;

    private String recipientName;
    private String recipientPhone;
    private String postalCode;
    private String address;
    private String addressDetail;
    private String deliveryMemo;

    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
