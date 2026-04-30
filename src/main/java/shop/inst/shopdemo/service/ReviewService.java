package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.review.CreateReviewRequest;
import shop.inst.shopdemo.dto.review.ReviewResponse;
import shop.inst.shopdemo.dto.review.UpdateReviewRequest;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.Review;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.NotificationType;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.repository.GoodsRepository;
import shop.inst.shopdemo.repository.OrderRepository;
import shop.inst.shopdemo.repository.ReviewRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final GoodsRepository goodsRepository;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    /** 리뷰 작성 (구매 이력이 있는 상품만) */
    @Transactional
    public ReviewResponse createReview(String username, CreateReviewRequest req) {
        User reviewer = findUser(username);
        Goods goods = goodsRepository.findById(req.getGoodsId())
                .orElseThrow(() -> new ResourceNotFoundException("상품을 찾을 수 없습니다."));

        // 구매 이력 확인
        boolean hasPurchased = !orderRepository.findByBuyerAndGoodsIdOrderByCreatedAtDesc(reviewer, goods.getId()).isEmpty();
        if (!hasPurchased) {
            throw new BadRequestException("구매 이력이 있는 상품만 리뷰를 작성할 수 있습니다.");
        }

        // 중복 리뷰 확인
        if (reviewRepository.existsByReviewerAndGoodsId(reviewer, goods.getId())) {
            throw new BadRequestException("이미 해당 상품에 리뷰를 작성했습니다.");
        }

        Review review = Review.builder()
                .reviewer(reviewer)
                .goods(goods)
                .rating(req.getRating())
                .content(req.getContent())
                .build();

        review = reviewRepository.save(review);

        // 셀러에게 알림
        notificationService.create(
                goods.getSeller(),
                NotificationType.REVIEW_RECEIVED,
                "새 리뷰가 등록되었습니다",
                reviewer.getUsername() + "님이 '" + goods.getName() + "'에 리뷰를 남겼습니다. (★" + req.getRating() + ")",
                null,
                goods.getId()
        );

        return toResponse(review);
    }

    /** 리뷰 수정 */
    @Transactional
    public ReviewResponse updateReview(String username, Long reviewId, UpdateReviewRequest req) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("리뷰를 찾을 수 없습니다."));
        if (!review.getReviewer().getUsername().equals(username)) {
            throw new BadRequestException("본인의 리뷰만 수정할 수 있습니다.");
        }
        review.setRating(req.getRating());
        review.setContent(req.getContent());
        review.setUpdatedAt(LocalDateTime.now());
        return toResponse(reviewRepository.save(review));
    }

    /** 리뷰 삭제 */
    @Transactional
    public void deleteReview(String username, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("리뷰를 찾을 수 없습니다."));
        if (!review.getReviewer().getUsername().equals(username)) {
            throw new BadRequestException("본인의 리뷰만 삭제할 수 있습니다.");
        }
        reviewRepository.delete(review);
    }

    /** 내 리뷰 목록 */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(String username) {
        User reviewer = findUser(username);
        return reviewRepository.findByReviewerOrderByCreatedAtDesc(reviewer).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 특정 상품의 리뷰 목록 (공개) */
    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByGoods(Long goodsId) {
        return reviewRepository.findByGoodsIdOrderByCreatedAtDesc(goodsId).stream()
                .map(this::toResponse)
                .toList();
    }

    /** 굿즈 리뷰 통계: 평균 / 개수 / 1~5 분포 */
    @Transactional(readOnly = true)
    public shop.inst.shopdemo.dto.review.ReviewStatsResponse getStatsByGoods(Long goodsId) {
        Double avg = reviewRepository.findAverageRatingByGoodsId(goodsId);
        long count = reviewRepository.countByGoodsId(goodsId);
        java.util.Map<Integer, Long> dist = new java.util.LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) dist.put(i, 0L);
        for (Object[] row : reviewRepository.findRatingDistributionByGoodsId(goodsId)) {
            Integer rating = ((Number) row[0]).intValue();
            Long cnt = ((Number) row[1]).longValue();
            dist.put(rating, cnt);
        }
        return shop.inst.shopdemo.dto.review.ReviewStatsResponse.builder()
                .average(avg)
                .count(count)
                .distribution(dist)
                .build();
    }

    /** 리뷰 작성 가능한 상품 목록 (구매 이력 O, 리뷰 미작성) */
    @Transactional(readOnly = true)
    public List<ReviewableGoodsInfo> getReviewableGoods(String username) {
        User reviewer = findUser(username);
        // 구매한 상품 ID 목록 (중복 제거)
        var orders = orderRepository.findByBuyerOrderByCreatedAtDesc(reviewer);
        return orders.stream()
                .map(o -> o.getGoods())
                .distinct()
                .filter(g -> !reviewRepository.existsByReviewerAndGoodsId(reviewer, g.getId()))
                .map(g -> new ReviewableGoodsInfo(g.getId(), g.getName(), g.getImageUrl()))
                .toList();
    }

    public record ReviewableGoodsInfo(Long goodsId, String goodsName, String goodsImageUrl) {}

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .goodsId(r.getGoods().getId())
                .goodsName(r.getGoods().getName())
                .goodsImageUrl(r.getGoods().getImageUrl())
                .reviewerUsername(r.getReviewer().getUsername())
                .rating(r.getRating())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
