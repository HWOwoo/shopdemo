package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
