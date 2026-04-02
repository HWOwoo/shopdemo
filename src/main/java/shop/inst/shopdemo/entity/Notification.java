package shop.inst.shopdemo.entity;

import jakarta.persistence.*;
import lombok.*;
import shop.inst.shopdemo.entity.enums.NotificationType;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 알림 받는 사용자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** 알림 유형 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    /** 알림 제목 */
    @Column(nullable = false)
    private String title;

    /** 알림 내용 */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    /** 관련 주문 ID (nullable) */
    private Long orderId;

    /** 관련 상품 ID (nullable) */
    private Long goodsId;

    /** 읽음 여부 */
    @Builder.Default
    @Column(nullable = false)
    private boolean read = false;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
