package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.goods.AdminReviewRequest;
import shop.inst.shopdemo.dto.goods.GoodsResponse;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.GoodsRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final GoodsRepository goodsRepository;
    private final EmailService emailService;
    private final GoodsService goodsService;

    @Transactional(readOnly = true)
    public GoodsResponse getGoodsById(Long id) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));
        return goodsService.toResponse(goods);
    }

    public List<GoodsResponse> getPendingGoods() {
        return goodsRepository.findByStatus(GoodsStatus.PENDING).stream()
                .map(goodsService::toResponse)
                .toList();
    }

    /** 어드민: 전체 굿즈 목록 (상태 필터 + 키워드 검색) */
    @Transactional(readOnly = true)
    public List<GoodsResponse> getAllGoodsForAdmin(String statusFilter, String keyword) {
        GoodsStatus status = null;
        if (statusFilter != null && !statusFilter.isBlank() && !"ALL".equalsIgnoreCase(statusFilter)) {
            try {
                status = GoodsStatus.valueOf(statusFilter.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid status: " + statusFilter);
            }
        }
        String kw = keyword == null ? "" : keyword.trim();
        return goodsRepository.searchForAdmin(status, kw.isEmpty() ? null : kw).stream()
                .map(goodsService::toResponse)
                .toList();
    }

    @Transactional
    public GoodsResponse reviewGoods(Long id, AdminReviewRequest request) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));

        if (goods.getStatus() != GoodsStatus.PENDING) {
            throw new BadRequestException("Goods is not in PENDING status");
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            goods.setStatus(GoodsStatus.APPROVED);
            goodsRepository.save(goods);
            emailService.sendApprovalEmail(goods);
        } else {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("Rejection reason is required");
            }
            goods.setStatus(GoodsStatus.REJECTED);
            goods.setRejectionReason(request.getRejectionReason());
            goodsRepository.save(goods);
            emailService.sendRejectionEmail(goods);
        }

        return goodsService.toResponse(goods);
    }
}
