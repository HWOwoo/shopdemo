package shop.inst.shopdemo.dto.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(regexp = "^[0-9\\-]{10,13}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String contactPhone;
}
