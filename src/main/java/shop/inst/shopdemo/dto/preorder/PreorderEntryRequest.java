package shop.inst.shopdemo.dto.preorder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PreorderEntryRequest {

    @NotEmpty
    @Valid
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        @NotNull
        private Long optionId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}
