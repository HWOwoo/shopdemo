package shop.inst.shopdemo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.wishlist.WishlistResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.WishlistService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /** 찜 토글 (찜 추가/취소) */
    @PostMapping("/{goodsId}")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggle(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long goodsId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                wishlistService.toggleWishlist(principal.getUsername(), goodsId)
        ));
    }

    /** 내 찜 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<WishlistResponse>>> getMyWishlist(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                wishlistService.getMyWishlist(principal.getUsername())
        ));
    }

    /** 특정 상품 찜 여부 확인 */
    @GetMapping("/{goodsId}/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long goodsId
    ) {
        boolean wishlisted = wishlistService.isWishlisted(principal.getUsername(), goodsId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("wishlisted", wishlisted)));
    }

    /** 찜 해제 */
    @DeleteMapping("/{goodsId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long goodsId
    ) {
        wishlistService.removeWishlist(principal.getUsername(), goodsId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
