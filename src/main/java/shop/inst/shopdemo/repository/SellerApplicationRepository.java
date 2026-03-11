package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.SellerApplication;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.entity.enums.ApplicationStatus;

import java.util.List;
import java.util.Optional;

public interface SellerApplicationRepository extends JpaRepository<SellerApplication, Long> {
    Optional<SellerApplication> findByUser(User user);
    boolean existsByUser(User user);
    List<SellerApplication> findByStatus(ApplicationStatus status);
    List<SellerApplication> findAllByOrderByCreatedAtDesc();
}
