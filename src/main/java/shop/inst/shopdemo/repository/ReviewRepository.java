package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import shop.inst.shopdemo.entity.Review;
import shop.inst.shopdemo.entity.User;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByReviewerOrderByCreatedAtDesc(User reviewer);

    List<Review> findByGoodsIdOrderByCreatedAtDesc(Long goodsId);

    Optional<Review> findByReviewerAndGoodsId(User reviewer, Long goodsId);

    boolean existsByReviewerAndGoodsId(User reviewer, Long goodsId);

    /** 굿즈의 평균 평점 (리뷰 없으면 null) */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.goods.id = :goodsId")
    Double findAverageRatingByGoodsId(@Param("goodsId") Long goodsId);

    long countByGoodsId(Long goodsId);

    /** 굿즈의 평점별 개수 (rating, count) */
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.goods.id = :goodsId GROUP BY r.rating")
    List<Object[]> findRatingDistributionByGoodsId(@Param("goodsId") Long goodsId);
}
