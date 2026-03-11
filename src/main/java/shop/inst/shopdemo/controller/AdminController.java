package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.auth.AuthResponse;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.goods.AdminReviewRequest;
import shop.inst.shopdemo.dto.goods.GoodsResponse;
import shop.inst.shopdemo.dto.seller.AdminSellerReviewRequest;
import shop.inst.shopdemo.dto.seller.SellerApplicationResponse;
import shop.inst.shopdemo.service.AdminService;
import shop.inst.shopdemo.service.SellerApplicationService;
import shop.inst.shopdemo.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final SellerApplicationService sellerApplicationService;

    @GetMapping("/goods/pending")
    public ResponseEntity<ApiResponse<List<GoodsResponse>>> getPendingGoods() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingGoods()));
    }

    @GetMapping("/goods/{id}")
    public ResponseEntity<ApiResponse<GoodsResponse>> getGoodsById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getGoodsById(id)));
    }

    @PostMapping("/goods/{id}/review")
    public ResponseEntity<ApiResponse<GoodsResponse>> reviewGoods(
            @PathVariable Long id,
            @Valid @RequestBody AdminReviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminService.reviewGoods(id, request)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AuthResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    @GetMapping("/seller-applications")
    public ResponseEntity<ApiResponse<List<SellerApplicationResponse>>> getSellerApplications() {
        return ResponseEntity.ok(ApiResponse.success(sellerApplicationService.getAllApplications()));
    }

    @GetMapping("/seller-applications/pending")
    public ResponseEntity<ApiResponse<List<SellerApplicationResponse>>> getPendingSellerApplications() {
        return ResponseEntity.ok(ApiResponse.success(sellerApplicationService.getPendingApplications()));
    }

    @PostMapping("/seller-applications/{id}/review")
    public ResponseEntity<ApiResponse<SellerApplicationResponse>> reviewSellerApplication(
            @PathVariable Long id,
            @Valid @RequestBody AdminSellerReviewRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(sellerApplicationService.reviewApplication(id, request)));
    }
}
