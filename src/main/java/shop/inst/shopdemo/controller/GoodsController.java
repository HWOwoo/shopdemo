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
import shop.inst.shopdemo.service.GoodsService;
import shop.inst.shopdemo.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/goods")
@RequiredArgsConstructor
public class GoodsController {

    private final GoodsService goodsService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<GoodsResponse>>> getApprovedGoods(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "SALE") GoodsType type
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(goodsService.getApprovedGoods(type, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoodsResponse>> getGoods(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(goodsService.getGoodsById(id)));
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

    @PostMapping("/{id}/purchase")
    public ResponseEntity<ApiResponse<OrderResponse>> purchase(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                orderService.createOrder(principal.getUsername(), id, request)
        ));
    }
}
