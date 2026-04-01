package shop.inst.shopdemo.dto.review;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long goodsId;
    private String goodsName;
    private String goodsImageUrl;
    private String reviewerUsername;
    private int rating;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
