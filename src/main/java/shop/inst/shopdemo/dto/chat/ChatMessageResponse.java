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
public class ChatMessageResponse {

    private Long id;
    private String senderUsername;
    private String content;
    private boolean readByReceiver;
    private LocalDateTime createdAt;
}
