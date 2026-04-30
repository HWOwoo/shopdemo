package shop.inst.shopdemo.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.Notice;

import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    List<Notice> findAllByOrderByPinnedDescCreatedAtDesc();

    List<Notice> findByPinnedTrueOrderByCreatedAtDesc();

    List<Notice> findTopByOrderByPinnedDescCreatedAtDesc(Pageable pageable);
}
