package shop.inst.shopdemo.dto.goods;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsOptionResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private String shortDescription;

    /** null = 재고 제한 없음 */
    private Integer stock;

    private String imageUrl;
}
