package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "preorder_entry_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreorderEntryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private PreorderEntry entry;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private GoodsOption option;

    @Column(nullable = false)
    private Integer quantity;
}
