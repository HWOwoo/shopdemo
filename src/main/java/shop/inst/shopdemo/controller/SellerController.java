package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.auth.AuthResponse;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.seller.SellerApplyRequest;
import shop.inst.shopdemo.dto.seller.SellerApplicationResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.SellerApplicationService;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerController {

    private final SellerApplicationService sellerApplicationService;

    /** 판매자 신청 → 즉시 SELLER 전환된 새 JWT 반환 */
    @PostMapping("/apply")
    public ResponseEntity<ApiResponse<AuthResponse>> apply(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SellerApplyRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerApplicationService.apply(principal.getUsername(), request)));
    }

    /** 내 신청 현황 조회 */
    @GetMapping("/apply/me")
    public ResponseEntity<ApiResponse<SellerApplicationResponse>> getMyApplication(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                sellerApplicationService.getMyApplication(principal.getUsername()).orElse(null)));
    }
}
