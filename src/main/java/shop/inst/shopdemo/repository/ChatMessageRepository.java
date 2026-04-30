package shop.inst.shopdemo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import shop.inst.shopdemo.entity.ChatMessage;
import shop.inst.shopdemo.entity.ChatRoom;
import shop.inst.shopdemo.entity.User;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByRoomOrderByCreatedAtAsc(ChatRoom room);

    long countByRoomAndSenderNotAndReadByReceiverFalse(ChatRoom room, User sender);

    List<ChatMessage> findByRoomAndSenderNotAndReadByReceiverFalse(ChatRoom room, User sender);
}
