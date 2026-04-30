package shop.inst.shopdemo.dto.notice;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NoticeResponse {
    private Long id;
    private String title;
    private String content;
    private String authorUsername;
    private Boolean pinned;
    private Long viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
