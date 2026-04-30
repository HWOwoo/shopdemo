package shop.inst.shopdemo.dto.notice;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NoticeSummaryResponse {
    private Long id;
    private String title;
    private Boolean pinned;
    private Long viewCount;
    private LocalDateTime createdAt;
}
