package shop.inst.shopdemo.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import shop.inst.shopdemo.dto.common.ApiResponse;
import shop.inst.shopdemo.dto.user.UpdateProfileRequest;
import shop.inst.shopdemo.dto.user.UserProfileResponse;
import shop.inst.shopdemo.security.UserPrincipal;
import shop.inst.shopdemo.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** 공개 프로필 조회 (누구나 가능) */
    @GetMapping("/{username}/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @PathVariable String username
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getPublicProfile(username)));
    }

    /** 내 프로필 수정 (본인만) */
    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(principal.getUsername(), request)));
    }
}
