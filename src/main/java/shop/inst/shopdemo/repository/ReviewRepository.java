package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.Review;
import shop.inst.shopdemo.entity.User;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByReviewerOrderByCreatedAtDesc(User reviewer);

    List<Review> findByGoodsIdOrderByCreatedAtDesc(Long goodsId);

    Optional<Review> findByReviewerAndGoodsId(User reviewer, Long goodsId);

    boolean existsByReviewerAndGoodsId(User reviewer, Long goodsId);
}
