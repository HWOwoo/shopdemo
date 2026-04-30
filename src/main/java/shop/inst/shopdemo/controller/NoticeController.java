package shop.inst.shopdemo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.notice.NoticeResponse;
import shop.inst.shopdemo.dto.notice.NoticeSummaryResponse;
import shop.inst.shopdemo.service.NoticeService;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NoticeSummaryResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getAllSummaries()));
    }

    @GetMapping("/banner")
    public ResponseEntity<ApiResponse<List<NoticeSummaryResponse>>> banner(
            @RequestParam(defaultValue = "3") int limit
    ) {
        int safe = Math.min(Math.max(limit, 1), 10);
        return ResponseEntity.ok(ApiResponse.success(noticeService.getBanner(safe)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoticeResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.getById(id)));
    }
}
