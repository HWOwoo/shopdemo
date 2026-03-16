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

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // 판매자: 내 굿즈 주문 목록 조회
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
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
}
