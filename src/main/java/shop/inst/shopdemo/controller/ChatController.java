package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.chat.ChatMessageResponse;
import shop.inst.shopdemo.dto.chat.ChatRoomResponse;
import shop.inst.shopdemo.dto.chat.SendMessageRequest;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.ChatService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/rooms/{username}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreateRoom(
            @PathVariable String username,
            @AuthenticationPrincipal UserPrincipal principal) {
        ChatRoomResponse room = chatService.getOrCreateRoom(principal.getUsername(), username);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getMyRooms(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ChatRoomResponse> rooms = chatService.getMyRooms(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long roomId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ChatMessageResponse> messages = chatService.getMessages(principal.getUsername(), roomId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long roomId,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        ChatMessageResponse message = chatService.sendMessage(principal.getUsername(), roomId, req);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTotalUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = chatService.getTotalUnreadCount(principal.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }
}
