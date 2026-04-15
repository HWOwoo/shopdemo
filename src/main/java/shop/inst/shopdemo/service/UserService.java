package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.auth.AuthResponse;
import shop.inst.shopdemo.dto.user.UpdateProfileRequest;
import shop.inst.shopdemo.dto.user.UserProfileResponse;
import shop.inst.shopdemo.entity.User;
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
