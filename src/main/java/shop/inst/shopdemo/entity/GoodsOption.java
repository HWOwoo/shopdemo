package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "goods_option")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 옵션명 (예: "소형", "M", "빨강") */
    @Column(nullable = false)
    private String name;

    /** 옵션 가격 */
    @Column(nullable = false)
    private BigDecimal price;

    /** 재고 수량 (null = 제한 없음) */
    private Integer stock;

    /** 한줄 설명 */
    @Column(length = 200)
    private String shortDescription;

    /** 물품 이미지 URL */
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_id", nullable = false)
    private Goods goods;
}
