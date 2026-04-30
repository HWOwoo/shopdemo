package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.ChatRoom;
import shop.inst.shopdemo.entity.User;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByUser1AndUser2(User user1, User user2);

    List<ChatRoom> findByUser1OrUser2(User user1, User user2);
}
