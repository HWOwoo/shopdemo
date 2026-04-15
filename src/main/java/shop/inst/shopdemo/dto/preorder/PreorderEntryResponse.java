package shop.inst.shopdemo.dto.preorder;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PreorderEntryResponse {
    private Long id;
    private Long goodsId;
    private String goodsName;
    private String goodsImageUrl;
    private String username;
    private List<ItemResponse> items;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class ItemResponse {
        private Long optionId;
        private String optionName;
        private Integer quantity;
    }
}
