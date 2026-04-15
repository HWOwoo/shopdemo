package shop.inst.shopdemo.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReviewRequest {
    @NotNull
    private Long goodsId;

    @NotNull @Min(1) @Max(5)
    private Integer rating;

    @Size(max = 5000, message = "리뷰는 5000자 이내로 작성해주세요.")
    private String content;
}
