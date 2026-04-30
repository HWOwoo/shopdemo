package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.goods.CreateGoodsRequest;
import shop.inst.shopdemo.dto.goods.GoodsResponse;
import shop.inst.shopdemo.dto.order.CreateOrderRequest;
import shop.inst.shopdemo.dto.order.OrderResponse;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.dto.preorder.PreorderEntryRequest;
import shop.inst.shopdemo.dto.preorder.PreorderEntryResponse;
import shop.inst.shopdemo.dto.preorder.PreorderSummaryResponse;
import shop.inst.shopdemo.service.GoodsService;
import shop.inst.shopdemo.service.OrderService;
import shop.inst.shopdemo.service.PreorderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goods")
@RequiredArgsConstructor
public class GoodsController {

    private final GoodsService goodsService;
    private final OrderService orderService;
    private final PreorderService preorderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GoodsResponse>>> getApprovedGoods(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "SALE") GoodsType type,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "latest") String sort
    ) {
        if (size > 100) size = 100;
        Sort sortOption = switch (sort) {
            case "priceAsc" -> Sort.by("price").ascending();
            case "priceDesc" -> Sort.by("price").descending();
            case "deadlineAsc" -> Sort.by("preorderDeadline").ascending();
            default -> Sort.by("createdAt").descending();
        };
        PageRequest pageable = PageRequest.of(page, size, sortOption);
        return ResponseEntity.ok(ApiResponse.success(goodsService.getApprovedGoods(type, keyword, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoodsResponse>> getGoods(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.getGoodsById(id)));
    }

    /** 특정 판매자의 공개 굿즈 목록 (프로필 페이지용) */
    @GetMapping("/seller/{username}")
    public ResponseEntity<ApiResponse<List<GoodsResponse>>> getGoodsBySeller(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.getApprovedGoodsBySeller(username)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GoodsResponse>> createGoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGoodsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.createGoods(principal.getUsername(), request)));
    }

    @GetMapping("/my/{id}")
    public ResponseEntity<ApiResponse<GoodsResponse>> getMyGoodsById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.getMyGoodsById(principal.getUsername(), id)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GoodsResponse>>> getMyGoods(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.getMyGoods(principal.getUsername())));
    }

    @PutMapping("/my/{id}")
    public ResponseEntity<ApiResponse<GoodsResponse>> updateMyGoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateGoodsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.updateGoods(principal.getUsername(), id, request)));
    }

    @DeleteMapping("/my/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMyGoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        goodsService.deleteMyGoods(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Goods deleted", null));
    }

    @PutMapping("/my/{id}/close")
    public ResponseEntity<ApiResponse<GoodsResponse>> closeGoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.closeGoods(principal.getUsername(), id)));
    }

    @PutMapping("/my/{id}/soldout")
    public ResponseEntity<ApiResponse<GoodsResponse>> toggleSoldOut(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.toggleSoldOut(principal.getUsername(), id)));
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<ApiResponse<OrderResponse>> purchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.createOrder(principal.getUsername(), id, request)
        ));
    }

    // ── 수요조사 엔드포인트 ──

    /** 수요조사 신청 */
    @PostMapping("/{id}/preorder")
    public ResponseEntity<ApiResponse<PreorderEntryResponse>> registerPreorder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PreorderEntryRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                preorderService.register(principal.getUsername(), id, request)
        ));
    }

    /** 수요조사 신청 취소 */
    @DeleteMapping("/{id}/preorder")
    public ResponseEntity<ApiResponse<Void>> cancelPreorder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        preorderService.cancel(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("신청이 취소되었습니다.", null));
    }

    /** 수요조사 신청 여부 확인 */
    @GetMapping("/{id}/preorder/check")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkPreorder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        boolean registered = preorderService.hasRegistered(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("registered", registered)));
    }

    /** 수요조사 신청 목록 (판매자용) */
    @GetMapping("/my/{id}/preorder-entries")
    public ResponseEntity<ApiResponse<List<PreorderEntryResponse>>> getPreorderEntries(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                preorderService.getEntriesForGoods(principal.getUsername(), id)
        ));
    }

    /** 수요조사 집계 조회 (판매자용) */
    @GetMapping("/my/{id}/preorder-summary")
    public ResponseEntity<ApiResponse<PreorderSummaryResponse>> getPreorderSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                preorderService.getSummary(principal.getUsername(), id)
        ));
    }

    /** 생산 확정 (판매자: PREORDER → SALE 전환) */
    @PostMapping("/my/{id}/preorder-confirm")
    public ResponseEntity<ApiResponse<Void>> confirmPreorder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        preorderService.confirmPreorder(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("생산이 확정되었습니다.", null));
    }

    /** 생산 취소 (판매자: CLOSED → 신청자 알림) */
    @PostMapping("/my/{id}/preorder-cancel")
    public ResponseEntity<ApiResponse<Void>> cancelPreorderProduction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        preorderService.cancelPreorder(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("생산이 취소되었습니다.", null));
    }

    /** 내 수요조사 신청 목록 (구매자용) */
    @GetMapping("/preorder/my")
    public ResponseEntity<ApiResponse<List<PreorderEntryResponse>>> getMyPreorderEntries(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                preorderService.getMyEntries(principal.getUsername())
        ));
    }

    // ── 추가 이미지 엔드포인트 ──

    /** 추가 이미지 등록 (이미 업로드된 URL 목록 전달) */
    @PostMapping("/my/{id}/images")
    public ResponseEntity<ApiResponse<GoodsResponse>> addAdditionalImages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody List<String> imageUrls
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                goodsService.addAdditionalImages(principal.getUsername(), id, imageUrls)
        ));
    }

    /** 추가 이미지 전체 삭제 */
    @DeleteMapping("/my/{id}/images")
    public ResponseEntity<ApiResponse<GoodsResponse>> deleteAdditionalImages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                goodsService.deleteAdditionalImages(principal.getUsername(), id)
        ));
    }
}
