package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "preorder_entries",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "goods_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreorderEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_id", nullable = false)
    private Goods goods;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<PreorderEntryItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
