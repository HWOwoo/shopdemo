package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.Goods;
import shop.inst.shopdemo.entity.PreorderEntry;
import shop.inst.shopdemo.entity.User;

import java.util.List;
import java.util.Optional;

public interface PreorderEntryRepository extends JpaRepository<PreorderEntry, Long> {

    boolean existsByUserAndGoods(User user, Goods goods);

    Optional<PreorderEntry> findByUserAndGoods(User user, Goods goods);

    List<PreorderEntry> findByGoodsOrderByCreatedAtDesc(Goods goods);

    List<PreorderEntry> findByUserOrderByCreatedAtDesc(User user);

    long countByGoods(Goods goods);
}
