package shop.inst.shopdemo.dto.order;

import lombok.Data;

@Data
public class OrderItemRequest {
    private Long optionId;
    private int quantity;
}
