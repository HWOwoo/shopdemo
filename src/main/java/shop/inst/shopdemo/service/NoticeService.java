package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.notice.NoticeRequest;
import shop.inst.shopdemo.dto.notice.NoticeResponse;
import shop.inst.shopdemo.dto.notice.NoticeSummaryResponse;
import shop.inst.shopdemo.entity.Notice;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.NoticeRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NoticeSummaryResponse> getAllSummaries() {
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NoticeSummaryResponse> getBanner(int limit) {
        return noticeRepository.findTopByOrderByPinnedDescCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public NoticeResponse getById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("공지사항을 찾을 수 없습니다."));
        notice.setViewCount(notice.getViewCount() == null ? 1L : notice.getViewCount() + 1);
        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse create(String adminUsername, NoticeRequest request) {
        User author = userRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Notice notice = Notice.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(author)
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .viewCount(0L)
                .build();
        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public NoticeResponse update(Long id, NoticeRequest request) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("공지사항을 찾을 수 없습니다."));
        notice.setTitle(request.getTitle());
        notice.setContent(request.getContent());
        notice.setPinned(Boolean.TRUE.equals(request.getPinned()));
        return toResponse(noticeRepository.save(notice));
    }

    @Transactional
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new ResourceNotFoundException("공지사항을 찾을 수 없습니다.");
        }
        noticeRepository.deleteById(id);
    }

    private NoticeResponse toResponse(Notice n) {
        return NoticeResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .authorUsername(n.getAuthor() != null ? n.getAuthor().getUsername() : null)
                .pinned(n.getPinned())
                .viewCount(n.getViewCount())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }

    private NoticeSummaryResponse toSummary(Notice n) {
        return NoticeSummaryResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .pinned(n.getPinned())
                .viewCount(n.getViewCount())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
