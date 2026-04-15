package shop.inst.shopdemo.dto.wishlist;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {
    private Long id;
    private Long goodsId;
    private String goodsName;
    private String goodsImageUrl;
    private BigDecimal price;
    private String sellerUsername;
    private boolean soldOut;
    private String goodsType;
    private LocalDateTime createdAt;
}
