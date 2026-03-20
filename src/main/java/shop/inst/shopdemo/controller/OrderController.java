package shop.inst.shopdemo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.order.OrderResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // 판매자: 내 굿즈 주문 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getSellerOrders(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getOrdersForSeller(principal.getUsername())
        ));
    }

    // 판매자: 입금 확인
    @PutMapping("/{orderId}/confirm-payment")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.confirmPayment(principal.getUsername(), orderId)
        ));
    }

    // 판매자: 주문 취소
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.cancelOrder(principal.getUsername(), orderId)
        ));
    }

    // 판매자: 송장 등록/수정
    @PutMapping("/{orderId}/tracking")
    public ResponseEntity<ApiResponse<OrderResponse>> updateTracking(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.updateTracking(
                        principal.getUsername(),
                        orderId,
                        body.get("courierName"),
                        body.get("trackingNumber")
                )
        ));
    }

    // 구매자: 특정 굿즈 구매 이력
    @GetMapping("/my/goods/{goodsId}")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrdersForGoods(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long goodsId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getMyOrdersForGoods(principal.getUsername(), goodsId)
        ));
    }

    // 구매자: 내 구매 내역 조회
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getBuyerOrders(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.getOrdersForBuyer(principal.getUsername())
        ));
    }
}
