package shop.inst.shopdemo.dto.settlement;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectSettlementRequest {

    @NotBlank
    @Size(max = 500)
    private String reason;
}
