package shop.inst.shopdemo.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsResponse {
    /** 평균 평점 (리뷰 없으면 null) */
    private Double average;
    /** 총 리뷰 수 */
    private Long count;
    /** 평점별 개수 (1~5) */
    private Map<Integer, Long> distribution;
}
