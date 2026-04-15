package shop.inst.shopdemo.dto.preorder;

import lombok.Builder;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.GoodsStatus;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PreorderSummaryResponse {

    private Long goodsId;
    private String goodsName;
    private GoodsStatus goodsStatus;
    private LocalDateTime preorderDeadline;

    /** 총 신청 인원 */
    private int totalEntries;

    /** 옵션별 수량 집계 */
    private List<OptionAggregate> optionAggregates;

    /** 신청자별 목록 */
    private List<PreorderEntryResponse> entries;

    @Data
    @Builder
    public static class OptionAggregate {
        private Long optionId;
        private String optionName;
        private int totalQuantity;
    }
}
