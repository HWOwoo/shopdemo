package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.Wishlist;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    boolean existsByUserAndGoods(User user, Goods goods);
    Optional<Wishlist> findByUserAndGoods(User user, Goods goods);
    List<Wishlist> findByUserOrderByCreatedAtDesc(User user);
    List<Wishlist> findByGoods(Goods goods);
}
