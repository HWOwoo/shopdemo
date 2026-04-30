package shop.inst.shopdemo.dto.notice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NoticeRequest {

    @NotBlank(message = "제목을 입력해주세요.")
    @Size(max = 200)
    private String title;

    @NotBlank(message = "내용을 입력해주세요.")
    @Size(max = 50000)
    private String content;

    private Boolean pinned;
}
