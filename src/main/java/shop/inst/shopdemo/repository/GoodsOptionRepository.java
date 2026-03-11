package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.GoodsOption;

import java.util.List;

public interface GoodsOptionRepository extends JpaRepository<GoodsOption, Long> {
    List<GoodsOption> findByGoodsIdOrderByIdAsc(Long goodsId);
}
