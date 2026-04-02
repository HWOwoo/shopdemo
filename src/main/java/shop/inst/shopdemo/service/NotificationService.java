package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.notification.NotificationResponse;
import shop.inst.shopdemo.entity.Notification;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.NotificationType;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.NotificationRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** 알림 생성 */
    @Transactional
    public void create(User recipient, NotificationType type, String title, String message,
                       Long orderId, Long goodsId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .orderId(orderId)
                .goodsId(goodsId)
                .build();
        notificationRepository.save(notification);
    }

    /** 내 알림 목록 */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String username) {
        User user = findUser(username);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 읽지 않은 알림 개수 */
    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = findUser(username);
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    /** 단일 알림 읽음 처리 */
    @Transactional
    public void markAsRead(String username, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getUsername().equals(username)) {
            throw new BadRequestException("권한이 없습니다.");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    /** 전체 읽음 처리 */
    @Transactional
    public void markAllAsRead(String username) {
        User user = findUser(username);
        List<Notification> unread = notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
                .filter(n -> !n.isRead())
                .toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .orderId(n.getOrderId())
                .goodsId(n.getGoodsId())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
