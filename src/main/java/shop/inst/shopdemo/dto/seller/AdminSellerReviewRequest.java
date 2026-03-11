package shop.inst.shopdemo.dto.seller;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminSellerReviewRequest {

    @NotNull
    private Boolean approved;

    private String rejectionReason;
}
