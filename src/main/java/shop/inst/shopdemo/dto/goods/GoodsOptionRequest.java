package shop.inst.shopdemo.dto.goods;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class GoodsOptionRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    @Size(max = 200)
    private String shortDescription;

    /** 재고 수량 - null이면 제한 없음 */
    private Integer stock;

    /** 물품 이미지 URL */
    private String imageUrl;
}
