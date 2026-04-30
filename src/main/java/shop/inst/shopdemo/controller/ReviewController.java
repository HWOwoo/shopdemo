package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.review.CreateReviewRequest;
import shop.inst.shopdemo.dto.review.ReviewResponse;
import shop.inst.shopdemo.dto.review.ReviewStatsResponse;
import shop.inst.shopdemo.dto.review.UpdateReviewRequest;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** 리뷰 작성 */
    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.createReview(principal.getUsername(), request)
        ));
    }

    /** 리뷰 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.updateReview(principal.getUsername(), id, request)
        ));
    }

    /** 리뷰 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        reviewService.deleteReview(principal.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("리뷰가 삭제되었습니다.", null));
    }

    /** 내 리뷰 목록 */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getMyReviews(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getMyReviews(principal.getUsername())
        ));
    }

    /** 리뷰 작성 가능한 상품 목록 */
    @GetMapping("/reviewable")
    public ResponseEntity<ApiResponse<List<ReviewService.ReviewableGoodsInfo>>> getReviewableGoods(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getReviewableGoods(principal.getUsername())
        ));
    }

    /** 특정 상품의 리뷰 목록 (공개) */
    @GetMapping("/goods/{goodsId}")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getGoodsReviews(
            @PathVariable Long goodsId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                reviewService.getReviewsByGoods(goodsId)
        ));
    }

    /** 특정 상품의 리뷰 통계 (평균/개수/분포) — 공개 */
    @GetMapping("/goods/{goodsId}/stats")
    public ResponseEntity<ApiResponse<ReviewStatsResponse>> getGoodsReviewStats(
            @PathVariable Long goodsId
    ) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getStatsByGoods(goodsId)));
    }
}
