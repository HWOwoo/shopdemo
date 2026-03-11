package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.auth.AuthResponse;
import shop.inst.shopdemo.dto.seller.AdminSellerReviewRequest;
import shop.inst.shopdemo.dto.seller.SellerApplyRequest;
import shop.inst.shopdemo.dto.seller.SellerApplicationResponse;
import shop.inst.shopdemo.entity.SellerApplication;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.ApplicationStatus;
import shop.inst.shopdemo.entity.enums.Role;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.SellerApplicationRepository;
import shop.inst.shopdemo.repository.UserRepository;
import shop.inst.shopdemo.security.JwtService;
import shop.inst.shopdemo.security.UserPrincipal;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SellerApplicationService {

    private final SellerApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    /**
     * 판매자 신청 → 즉시 SELLER 전환 + 새 JWT 발급
     * 신청 상태는 PENDING이므로 공개 판매글은 아직 숨겨짐
     */
    @Transactional
    public AuthResponse apply(String username, SellerApplyRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.SELLER) {
            throw new BadRequestException("이미 판매자로 등록되어 있습니다.");
        }

        if (applicationRepository.existsByUser(user)) {
            throw new BadRequestException("이미 판매자 신청을 완료하였습니다.");
        }

        // 신청서 생성 (PENDING)
        SellerApplication application = SellerApplication.builder()
                .user(user)
                .shopName(request.getShopName())
                .description(request.getDescription())
                .contactPhone(request.getContactPhone())
                .status(ApplicationStatus.PENDING)
                .build();
        applicationRepository.save(application);

        // 즉시 SELLER 권한 부여
        user.setRole(Role.SELLER);
        userRepository.save(user);

        // SELLER 권한이 담긴 새 JWT 발급
        UserPrincipal principal = UserPrincipal.from(user);
        String token = jwtService.generateToken(principal);

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public Optional<SellerApplicationResponse> getMyApplication(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return applicationRepository.findByUser(user).map(this::toResponse);
    }

    public List<SellerApplicationResponse> getPendingApplications() {
        return applicationRepository.findByStatus(ApplicationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<SellerApplicationResponse> getAllApplications() {
        return applicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 어드민 심사:
     * - 승인 → application.status = APPROVED (이미 SELLER 권한 있음, 이제 공개 상품 노출)
     * - 거절 → application.status = REJECTED + user.role = BUYER로 복원
     */
    @Transactional
    public SellerApplicationResponse reviewApplication(Long id, AdminSellerReviewRequest request) {
        SellerApplication application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + id));

        if (application.getStatus() != ApplicationStatus.PENDING) {
            throw new BadRequestException("이미 처리된 신청입니다.");
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            application.setStatus(ApplicationStatus.APPROVED);
        } else {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("거절 사유를 입력해주세요.");
            }
            application.setStatus(ApplicationStatus.REJECTED);
            application.setRejectionReason(request.getRejectionReason());
            // 거절 시 SELLER 권한 회수
            User user = application.getUser();
            user.setRole(Role.BUYER);
            userRepository.save(user);
        }

        return toResponse(applicationRepository.save(application));
    }

    private SellerApplicationResponse toResponse(SellerApplication application) {
        return SellerApplicationResponse.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .username(application.getUser().getUsername())
                .shopName(application.getShopName())
                .description(application.getDescription())
                .contactPhone(application.getContactPhone())
                .status(application.getStatus())
                .rejectionReason(application.getRejectionReason())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .build();
    }
}
