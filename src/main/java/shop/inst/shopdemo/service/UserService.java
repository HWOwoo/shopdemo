package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.auth.AuthResponse;
import shop.inst.shopdemo.dto.user.AdminUpdateUserRequest;
import shop.inst.shopdemo.dto.user.AdminUserResponse;
import shop.inst.shopdemo.dto.user.UpdateProfileRequest;
import shop.inst.shopdemo.dto.user.UserProfileResponse;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.Role;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public AuthResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return AuthResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getPublicProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setBio(request.getBio());
        user.setTwitterUrl(request.getTwitterUrl());
        user.setPixivUrl(request.getPixivUrl());
        user.setInstagramUrl(request.getInstagramUrl());
        userRepository.save(user);
        return toProfileResponse(user);
    }

    public List<AuthResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> AuthResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .role(u.getRole())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsersForAdmin() {
        return userRepository.findAll().stream()
                .map(this::toAdminResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse adminUpdateUser(Long adminUserId, Long targetUserId, AdminUpdateUserRequest request) {
        if (adminUserId != null && adminUserId.equals(targetUserId)) {
            throw new BadRequestException("본인 계정은 수정할 수 없습니다.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("회원을 찾을 수 없습니다."));
        if (request.getRole() != null) {
            if (user.getRole() == Role.ADMIN) {
                throw new BadRequestException("관리자 계정의 역할은 변경할 수 없습니다.");
            }
            if (request.getRole() == Role.ADMIN) {
                throw new BadRequestException("관리자 권한은 부여할 수 없습니다.");
            }
            user.setRole(request.getRole());
        }
        if (request.getActive() != null) {
            if (user.getRole() == Role.ADMIN && !request.getActive()) {
                throw new BadRequestException("관리자 계정은 비활성화할 수 없습니다.");
            }
            user.setActive(request.getActive());
        }
        return toAdminResponse(userRepository.save(user));
    }

    private AdminUserResponse toAdminResponse(User u) {
        return AdminUserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .active(u.getActive() == null || u.getActive())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .bio(user.getBio())
                .role(user.getRole())
                .twitterUrl(user.getTwitterUrl())
                .pixivUrl(user.getPixivUrl())
                .instagramUrl(user.getInstagramUrl())
                .build();
    }
}
