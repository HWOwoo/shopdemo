package shop.inst.shopdemo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.notification.NotificationResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** 내 알림 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getMyNotifications(principal.getUsername())
        ));
    }

    /** 읽지 않은 알림 개수 */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        long count = notificationService.getUnreadCount(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    /** 단일 알림 읽음 처리 */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("읽음 처리되었습니다.", null));
    }

    /** 전체 읽음 처리 */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAllAsRead(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success("전체 읽음 처리되었습니다.", null));
    }
}
