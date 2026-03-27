package shop.inst.shopdemo.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemRequest {

    @NotNull(message = "옵션 ID를 입력해주세요.")
    private Long optionId;

    @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
    private int quantity;
}
