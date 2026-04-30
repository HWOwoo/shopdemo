package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.goods.CreateGoodsRequest;
import shop.inst.shopdemo.dto.goods.GoodsOptionResponse;
import shop.inst.shopdemo.dto.goods.GoodsResponse;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.GoodsOption;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.ApplicationStatus;
import shop.inst.shopdemo.entity.enums.GoodsStatus;
import shop.inst.shopdemo.entity.enums.GoodsType;
import shop.inst.shopdemo.entity.enums.PaymentType;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.exception.UnauthorizedException;
import shop.inst.shopdemo.repository.GoodsOptionRepository;
import shop.inst.shopdemo.repository.GoodsRepository;
import shop.inst.shopdemo.repository.PreorderEntryRepository;
import shop.inst.shopdemo.repository.ReviewRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoodsService {

    private final GoodsRepository goodsRepository;
    private final GoodsOptionRepository goodsOptionRepository;
    private final UserRepository userRepository;
    private final PreorderEntryRepository preorderEntryRepository;
    private final ReviewRepository reviewRepository;
    private final EmailService emailService;

    /** 공개 상품 목록: 상품 APPROVED + 판매자 신청 APPROVED + 판매 유형 필터 + 검색 */
    @Transactional(readOnly = true)
    public Page<GoodsResponse> getApprovedGoods(GoodsType goodsType, String keyword, Pageable pageable) {
        if (keyword != null && !keyword.isBlank()) {
            return goodsRepository.searchByKeyword(
                            GoodsStatus.APPROVED, ApplicationStatus.APPROVED, goodsType, keyword.trim(), pageable)
                    .map(this::toResponse);
        }
        return goodsRepository.findByStatusAndSellerApprovedAndType(
                        GoodsStatus.APPROVED, ApplicationStatus.APPROVED, goodsType, pageable)
                .map(this::toResponse);
    }

    /** 공개 상품 단건: 상품 APPROVED + 판매자 신청 APPROVED인 것만 노출 */
    @Transactional(readOnly = true)
    public GoodsResponse getGoodsById(Long id) {
        Goods goods = goodsRepository
                .findByIdAndStatusAndSellerApproved(id, GoodsStatus.APPROVED, ApplicationStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));
        return toResponse(goods);
    }

    @Transactional
    public GoodsResponse createGoods(String username, CreateGoodsRequest request) {
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getOptions() == null || request.getOptions().isEmpty()) {
            throw new BadRequestException("옵션을 최소 1개 이상 추가해주세요.");
        }

        if (Boolean.TRUE.equals(request.getRequiresCopyrightPermission())
                && (request.getRightsHolderEmail() == null || request.getRightsHolderEmail().isBlank())) {
            throw new BadRequestException("저작권 허가 필요 시 원작자 이메일을 입력해주세요.");
        }

        if (request.getPaymentType() == PaymentType.BANK_TRANSFER) {
            if (request.getBankName() == null || request.getBankName().isBlank()) {
                throw new BadRequestException("계좌이체 결제 시 은행명을 입력해주세요.");
            }
            if (request.getBankAccount() == null || request.getBankAccount().isBlank()) {
                throw new BadRequestException("계좌이체 결제 시 계좌번호를 입력해주세요.");
            }
            if (request.getBankAccountHolder() == null || request.getBankAccountHolder().isBlank()) {
                throw new BadRequestException("계좌이체 결제 시 예금주를 입력해주세요.");
            }
        }

        // 옵션 중 최저가를 Goods.price 로 저장 (카드 표시용)
        BigDecimal minPrice = request.getOptions().stream()
                .map(o -> o.getPrice())
                .min(BigDecimal::compareTo)
                .orElseThrow(() -> new BadRequestException("옵션 가격이 필요합니다."));

        // 재고 합계 (null 옵션은 0으로 계산, 최소 1개 null이면 stock=-1 sentinel)
        boolean hasUnlimited = request.getOptions().stream().anyMatch(o -> o.getStock() == null);
        int totalStock = hasUnlimited ? Integer.MAX_VALUE
                : request.getOptions().stream().mapToInt(o -> o.getStock()).sum();

        // 모든 상품은 관리자 승인 후 공개 (저작권 여부 무관하게 PENDING 시작)
        GoodsStatus initialStatus = GoodsStatus.PENDING;

        GoodsType type = request.getGoodsType() != null ? request.getGoodsType() : GoodsType.SALE;

        // PREORDER 타입은 마감일 필수 + 미래 날짜여야 함
        if (type == GoodsType.PREORDER) {
            if (request.getPreorderDeadline() == null) {
                throw new BadRequestException("사전수요조사는 마감일을 설정해주세요.");
            }
            if (request.getPreorderDeadline().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("수요조사 마감일은 현재 시각 이후여야 합니다.");
            }
        }

        String additionalImagesStr = toAdditionalImagesString(request.getAdditionalImages());

        Goods goods = Goods.builder()
                .goodsType(type)
                .name(request.getName())
                .description(request.getDescription())
                .price(minPrice)
                .stock(totalStock)
                .deliveryFee(request.getDeliveryFee())
                .paymentType(request.getPaymentType())
                .bankName(request.getBankName())
                .bankAccount(request.getBankAccount())
                .bankAccountHolder(request.getBankAccountHolder())
                .requiresCopyrightPermission(request.getRequiresCopyrightPermission())
                .rightsHolderEmail(request.getRightsHolderEmail())
                .preorderDeadline(type == GoodsType.PREORDER ? request.getPreorderDeadline() : null)
                .category(request.getCategory())
                .tags(request.getTags())
                .additionalImages(additionalImagesStr)
                .status(initialStatus)
                .copyrightEmailSent(false)
                .seller(seller)
                .build();

        goodsRepository.save(goods);

        // 옵션 저장
        List<GoodsOption> options = request.getOptions().stream()
                .map(o -> GoodsOption.builder()
                        .name(o.getName())
                        .shortDescription(o.getShortDescription())
                        .price(o.getPrice())
                        .stock(o.getStock())
                        .imageUrl(o.getImageUrl())
                        .goods(goods)
                        .build())
                .toList();
        goodsOptionRepository.saveAll(options);
        goods.setOptions(options);

        if (Boolean.TRUE.equals(goods.getRequiresCopyrightPermission())) {
            emailService.sendCopyrightPermissionRequest(goods);
            goods.setCopyrightEmailSent(true);
            goodsRepository.save(goods);
        }

        return toResponse(goods);
    }

    /** 특정 판매자의 승인된 상품 목록 (공개 프로필용) */
    @Transactional(readOnly = true)
    public List<GoodsResponse> getApprovedGoodsBySeller(String sellerUsername) {
        User seller = userRepository.findByUsername(sellerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + sellerUsername));
        return goodsRepository.findBySellerAndStatus(seller, GoodsStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GoodsResponse getMyGoodsById(String username, Long id) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));
        if (!goods.getSeller().getUsername().equals(username)) {
            throw new UnauthorizedException("You are not the seller of this goods");
        }
        return toResponse(goods);
    }

    @Transactional
    public GoodsResponse updateGoods(String username, Long id, CreateGoodsRequest request) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));

        if (!goods.getSeller().getUsername().equals(username)) {
            throw new UnauthorizedException("You are not the seller of this goods");
        }

        if (goods.getStatus() == GoodsStatus.APPROVED) {
            throw new BadRequestException("승인된 상품은 수정할 수 없습니다.");
        }

        if (request.getOptions() == null || request.getOptions().isEmpty()) {
            throw new BadRequestException("옵션을 최소 1개 이상 추가해주세요.");
        }

        if (Boolean.TRUE.equals(request.getRequiresCopyrightPermission())
                && (request.getRightsHolderEmail() == null || request.getRightsHolderEmail().isBlank())) {
            throw new BadRequestException("저작권 허가 필요 시 원작자 이메일을 입력해주세요.");
        }

        if (request.getPaymentType() == PaymentType.BANK_TRANSFER) {
            if (request.getBankName() == null || request.getBankName().isBlank())
                throw new BadRequestException("계좌이체 결제 시 은행명을 입력해주세요.");
            if (request.getBankAccount() == null || request.getBankAccount().isBlank())
                throw new BadRequestException("계좌이체 결제 시 계좌번호를 입력해주세요.");
            if (request.getBankAccountHolder() == null || request.getBankAccountHolder().isBlank())
                throw new BadRequestException("계좌이체 결제 시 예금주를 입력해주세요.");
        }

        BigDecimal minPrice = request.getOptions().stream()
                .map(o -> o.getPrice())
                .min(BigDecimal::compareTo)
                .orElseThrow(() -> new BadRequestException("옵션 가격이 필요합니다."));

        boolean hasUnlimited = request.getOptions().stream().anyMatch(o -> o.getStock() == null);
        int totalStock = hasUnlimited ? Integer.MAX_VALUE
                : request.getOptions().stream().mapToInt(o -> o.getStock()).sum();

        GoodsType type = request.getGoodsType() != null ? request.getGoodsType() : GoodsType.SALE;
        if (type == GoodsType.PREORDER) {
            if (request.getPreorderDeadline() == null) {
                throw new BadRequestException("사전수요조사는 마감일을 설정해주세요.");
            }
            if (request.getPreorderDeadline().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("수요조사 마감일은 현재 시각 이후여야 합니다.");
            }
        }

        goods.setGoodsType(type);
        goods.setName(request.getName());
        goods.setDescription(request.getDescription());
        goods.setPrice(minPrice);
        goods.setStock(totalStock);
        goods.setDeliveryFee(request.getDeliveryFee());
        goods.setPaymentType(request.getPaymentType());
        goods.setBankName(request.getBankName());
        goods.setBankAccount(request.getBankAccount());
        goods.setBankAccountHolder(request.getBankAccountHolder());
        goods.setRequiresCopyrightPermission(request.getRequiresCopyrightPermission());
        goods.setRightsHolderEmail(request.getRightsHolderEmail());
        goods.setPreorderDeadline(type == GoodsType.PREORDER ? request.getPreorderDeadline() : null);
        goods.setCategory(request.getCategory());
        goods.setTags(request.getTags());
        goods.setAdditionalImages(toAdditionalImagesString(request.getAdditionalImages()));
        goods.setStatus(GoodsStatus.PENDING);
        goods.setRejectionReason(null);

        // 기존 옵션 교체 (orphanRemoval이 삭제를 처리)
        goods.getOptions().clear();
        goodsRepository.flush();

        List<GoodsOption> options = request.getOptions().stream()
                .map(o -> GoodsOption.builder()
                        .name(o.getName())
                        .shortDescription(o.getShortDescription())
                        .price(o.getPrice())
                        .stock(o.getStock())
                        .imageUrl(o.getImageUrl())
                        .goods(goods)
                        .build())
                .toList();
        goodsOptionRepository.saveAll(options);
        goods.setOptions(options);
        goodsRepository.save(goods);

        return toResponse(goods);
    }

    @Transactional(readOnly = true)
    public List<GoodsResponse> getMyGoods(String username) {
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return goodsRepository.findBySeller(seller).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteMyGoods(String username, Long id) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));

        if (!goods.getSeller().getUsername().equals(username)) {
            throw new UnauthorizedException("You are not the seller of this goods");
        }

        if (goods.getStatus() == GoodsStatus.APPROVED) {
            throw new BadRequestException("Cannot delete approved goods");
        }

        goodsRepository.delete(goods);
    }

    /** 판매 종료 (CLOSED) */
    @Transactional
    public GoodsResponse closeGoods(String username, Long id) {
        Goods goods = getOwnedGoods(username, id);
        if (goods.getStatus() != GoodsStatus.APPROVED && goods.getStatus() != GoodsStatus.SOLDOUT) {
            throw new BadRequestException("판매 중인 상품만 종료할 수 있습니다.");
        }
        goods.setStatus(GoodsStatus.CLOSED);
        return toResponse(goodsRepository.save(goods));
    }

    /** 품절 처리 토글 (SOLDOUT ↔ APPROVED) */
    @Transactional
    public GoodsResponse toggleSoldOut(String username, Long id) {
        Goods goods = getOwnedGoods(username, id);
        if (goods.getStatus() == GoodsStatus.SOLDOUT) {
            goods.setStatus(GoodsStatus.APPROVED);
            goods.setManualSoldOut(false);
        } else if (goods.getStatus() == GoodsStatus.APPROVED) {
            goods.setStatus(GoodsStatus.SOLDOUT);
            goods.setManualSoldOut(true);
        } else {
            throw new BadRequestException("판매 중이거나 품절 상태인 상품만 변경할 수 있습니다.");
        }
        return toResponse(goodsRepository.save(goods));
    }

    /** 추가 이미지 등록 (기존 목록에 추가, 최대 5장) */
    @Transactional
    public GoodsResponse addAdditionalImages(String username, Long id, List<String> imageUrls) {
        Goods goods = getOwnedGoods(username, id);
        List<String> existing = fromAdditionalImagesString(goods.getAdditionalImages());
        existing.addAll(imageUrls);
        if (existing.size() > 5) {
            throw new BadRequestException("추가 이미지는 최대 5장까지 등록할 수 있습니다.");
        }
        goods.setAdditionalImages(String.join(",", existing));
        return toResponse(goodsRepository.save(goods));
    }

    /** 추가 이미지 전체 삭제 */
    @Transactional
    public GoodsResponse deleteAdditionalImages(String username, Long id) {
        Goods goods = getOwnedGoods(username, id);
        goods.setAdditionalImages(null);
        return toResponse(goodsRepository.save(goods));
    }

    private Goods getOwnedGoods(String username, Long id) {
        Goods goods = goodsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goods not found: " + id));
        if (!goods.getSeller().getUsername().equals(username)) {
            throw new UnauthorizedException("권한이 없습니다.");
        }
        return goods;
    }

    public GoodsResponse toResponse(Goods goods) {
        List<GoodsOptionResponse> optionResponses = goods.getOptions().stream()
                .map(o -> GoodsOptionResponse.builder()
                        .id(o.getId())
                        .name(o.getName())
                        .shortDescription(o.getShortDescription())
                        .price(o.getPrice())
                        .stock(o.getStock())
                        .imageUrl(o.getImageUrl())
                        .build())
                .toList();

        // soldOut: 수동 품절 처리 or 모든 옵션 재고 0
        boolean manualSoldOut = Boolean.TRUE.equals(goods.getManualSoldOut())
                || goods.getStatus() == GoodsStatus.SOLDOUT;
        boolean soldOut;
        if (manualSoldOut) {
            soldOut = true;
        } else if (optionResponses.isEmpty()) {
            soldOut = goods.getStock() != null && goods.getStock() == 0;
        } else {
            boolean allHaveStock = optionResponses.stream().noneMatch(o -> o.getStock() == null);
            int total = optionResponses.stream()
                    .filter(o -> o.getStock() != null)
                    .mapToInt(GoodsOptionResponse::getStock)
                    .sum();
            soldOut = allHaveStock && total == 0;
        }

        // 카드 표시용 최저가
        BigDecimal displayPrice = optionResponses.stream()
                .map(GoodsOptionResponse::getPrice)
                .min(BigDecimal::compareTo)
                .orElse(goods.getPrice());

        return GoodsResponse.builder()
                .id(goods.getId())
                .goodsType(goods.getGoodsType())
                .name(goods.getName())
                .description(goods.getDescription())
                .price(displayPrice)
                .options(optionResponses)
                .soldOut(soldOut)
                .manualSoldOut(manualSoldOut)
                .deliveryFee(goods.getDeliveryFee())
                .paymentType(goods.getPaymentType())
                .bankName(goods.getBankName())
                .bankAccount(goods.getBankAccount())
                .bankAccountHolder(goods.getBankAccountHolder())
                .requiresCopyrightPermission(goods.getRequiresCopyrightPermission())
                .rightsHolderEmail(goods.getRightsHolderEmail())
                .status(goods.getStatus())
                .rejectionReason(goods.getRejectionReason())
                .sellerId(goods.getSeller().getId())
                .sellerUsername(goods.getSeller().getUsername())
                .preorderDeadline(goods.getPreorderDeadline())
                .preorderCount(goods.getGoodsType() == GoodsType.PREORDER
                        ? preorderEntryRepository.countByGoods(goods) : null)
                .category(goods.getCategory())
                .tags(goods.getTags())
                .additionalImages(fromAdditionalImagesString(goods.getAdditionalImages()))
                .averageRating(reviewRepository.findAverageRatingByGoodsId(goods.getId()))
                .reviewCount(reviewRepository.countByGoodsId(goods.getId()))
                .createdAt(goods.getCreatedAt())
                .updatedAt(goods.getUpdatedAt())
                .build();
    }

    private String toAdditionalImagesString(List<String> urls) {
        if (urls == null || urls.isEmpty()) return null;
        return String.join(",", urls.stream().filter(u -> u != null && !u.isBlank()).toList());
    }

    private List<String> fromAdditionalImagesString(String str) {
        if (str == null || str.isBlank()) return new java.util.ArrayList<>();
        return new java.util.ArrayList<>(List.of(str.split(",")));
    }
}
