package shop.inst.shopdemo.dto.notification;

import lombok.Builder;
import lombok.Data;
import shop.inst.shopdemo.entity.enums.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Long orderId;
    private Long goodsId;
    private boolean read;
    private LocalDateTime createdAt;
}
