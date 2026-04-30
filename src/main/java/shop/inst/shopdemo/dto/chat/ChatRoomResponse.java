package shop.inst.shopdemo.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomResponse {

    private Long roomId;
    private String otherUsername;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
}
