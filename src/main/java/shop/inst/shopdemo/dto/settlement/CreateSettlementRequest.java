package shop.inst.shopdemo.dto.settlement;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateSettlementRequest {

    @NotNull
    private Long sellerId;

    @NotNull
    private LocalDate periodStart;

    @NotNull
    private LocalDate periodEnd;
}
