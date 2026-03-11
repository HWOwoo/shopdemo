package shop.inst.shopdemo.dto.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SellerApplyRequest {

    @NotBlank
    @Size(min = 2, max = 50)
    private String shopName;

    @NotBlank
    @Size(max = 500)
    private String description;

    @NotBlank
    @Size(max = 20)
    private String contactPhone;
}
