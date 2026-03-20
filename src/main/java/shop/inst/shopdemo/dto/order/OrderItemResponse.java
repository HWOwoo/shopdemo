package shop.inst.shopdemo.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class OrderItemResponse {
    private Long optionId;
    private String optionName;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
