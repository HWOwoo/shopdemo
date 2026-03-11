package shop.inst.shopdemo.dto.goods;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminReviewRequest {

    @NotNull
    private Boolean approved;

    private String rejectionReason;
}
