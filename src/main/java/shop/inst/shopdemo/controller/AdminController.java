package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.goods.AdminReviewRequest;
import shop.inst.shopdemo.dto.goods.GoodsResponse;
import shop.inst.shopdemo.dto.notice.NoticeRequest;
import shop.inst.shopdemo.dto.notice.NoticeResponse;
import shop.inst.shopdemo.dto.order.OrderResponse;
import shop.inst.shopdemo.dto.seller.AdminSellerReviewRequest;
import shop.inst.shopdemo.dto.seller.SellerApplicationResponse;
import shop.inst.shopdemo.dto.settlement.CreateSettlementRequest;
import shop.inst.shopdemo.dto.settlement.RejectSettlementRequest;
import shop.inst.shopdemo.dto.settlement.SettlementResponse;
import shop.inst.shopdemo.dto.user.AdminUpdateUserRequest;
import shop.inst.shopdemo.dto.user.AdminUserResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.AdminService;
import shop.inst.shopdemo.service.NoticeService;
import shop.inst.shopdemo.service.OrderService;
import shop.inst.shopdemo.service.SellerApplicationService;
import shop.inst.shopdemo.service.SettlementService;
import shop.inst.shopdemo.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final SellerApplicationService sellerApplicationService;
    private final OrderService orderService;
    private final SettlementService settlementService;
    private final NoticeService noticeService;

    @GetMapping("/goods/pending")
    public ResponseEntity<ApiResponse<List<GoodsResponse>>> getPendingGoods() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingGoods()));
    }

    /** 전체 굿즈 조회 (status 필터 + 키워드 검색) */
    @GetMapping("/goods")
    public ResponseEntity<ApiResponse<List<GoodsResponse>>> getAllGoods(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllGoodsForAdmin(status, q)));
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
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsersForAdmin()));
    }

    /** 회원 역할 변경 · 활성/비활성 토글 */
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.adminUpdateUser(principal.getId(), id, request)));
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

    /** 전체 주문 조회 (status 파라미터로 필터) */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOrders(status)));
    }

    // 취소 요청 목록 조회
    @GetMapping("/orders/cancel-requests")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getCancelRequests() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getCancelRequests()));
    }

    // 취소 요청 승인
    @PostMapping("/orders/{orderId}/cancel-approve")
    public ResponseEntity<ApiResponse<OrderResponse>> approveCancelRequest(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.approveCancelRequest(orderId)));
    }

    // 취소 요청 거절
    @PostMapping("/orders/{orderId}/cancel-reject")
    public ResponseEntity<ApiResponse<OrderResponse>> rejectCancelRequest(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.rejectCancelRequest(orderId)));
    }

    // ── 정산 관리 ──

    /** 전체 정산 목록 조회 */
    @GetMapping("/settlements")
    public ResponseEntity<ApiResponse<List<SettlementResponse>>> getAllSettlements() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getAllSettlements()));
    }

    /** 정산 내역 생성 */
    @PostMapping("/settlements")
    public ResponseEntity<ApiResponse<SettlementResponse>> createSettlement(
            @Valid @RequestBody CreateSettlementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.createSettlement(request)));
    }

    /** 정산 완료 처리 */
    @PostMapping("/settlements/{id}/pay")
    public ResponseEntity<ApiResponse<SettlementResponse>> markSettlementAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.markAsPaid(id)));
    }

    /** 정산 신청 승인 (REQUESTED → PENDING) */
    @PostMapping("/settlements/{id}/approve")
    public ResponseEntity<ApiResponse<SettlementResponse>> approveSettlementRequest(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.approveRequest(id)));
    }

    /** 정산 신청 거절 (REQUESTED → REJECTED) */
    @PostMapping("/settlements/{id}/reject")
    public ResponseEntity<ApiResponse<SettlementResponse>> rejectSettlementRequest(
            @PathVariable Long id,
            @Valid @RequestBody RejectSettlementRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.rejectRequest(id, request.getReason())));
    }

    // ── 공지사항 관리 ──

    @PostMapping("/notices")
    public ResponseEntity<ApiResponse<NoticeResponse>> createNotice(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody NoticeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.create(principal.getUsername(), request)));
    }

    @PutMapping("/notices/{id}")
    public ResponseEntity<ApiResponse<NoticeResponse>> updateNotice(
            @PathVariable Long id,
            @Valid @RequestBody NoticeRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(noticeService.update(id, request)));
    }

    @DeleteMapping("/notices/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(@PathVariable Long id) {
        noticeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다.", null));
    }
}
