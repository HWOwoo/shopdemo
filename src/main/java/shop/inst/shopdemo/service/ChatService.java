package shop.inst.shopdemo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import shop.inst.shopdemo.dto.chat.ChatMessageResponse;
import shop.inst.shopdemo.dto.chat.ChatRoomResponse;
import shop.inst.shopdemo.dto.chat.SendMessageRequest;
import shop.inst.shopdemo.entity.ChatMessage;
import shop.inst.shopdemo.entity.ChatRoom;
import shop.inst.shopdemo.entity.User;
import shop.inst.shopdemo.exception.BadRequestException;
import shop.inst.shopdemo.exception.ResourceNotFoundException;
import shop.inst.shopdemo.exception.UnauthorizedException;
import shop.inst.shopdemo.repository.ChatMessageRepository;
import shop.inst.shopdemo.repository.ChatRoomRepository;
import shop.inst.shopdemo.repository.UserRepository;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatRoomResponse getOrCreateRoom(String myUsername, String otherUsername) {
        if (myUsername.equals(otherUsername)) {
            throw new BadRequestException("자기 자신에게는 메시지를 보낼 수 없습니다.");
        }

        User me = findUser(myUsername);
        User other = findUser(otherUsername);

        // id 오름차순 정렬
        User user1 = me.getId() < other.getId() ? me : other;
        User user2 = me.getId() < other.getId() ? other : me;

        ChatRoom room = chatRoomRepository.findByUser1AndUser2(user1, user2)
                .orElseGet(() -> chatRoomRepository.save(
                        ChatRoom.builder().user1(user1).user2(user2).build()
                ));

        return toRoomResponse(room, me);
    }

    @Transactional(readOnly = true)
    public List<ChatRoomResponse> getMyRooms(String username) {
        User me = findUser(username);
        List<ChatRoom> rooms = chatRoomRepository.findByUser1OrUser2(me, me);
        return rooms.stream()
                .map(room -> toRoomResponse(room, me))
                .sorted(Comparator.comparing(ChatRoomResponse::getLastMessageAt,
                        Comparator.nullsFirst(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public List<ChatMessageResponse> getMessages(String username, Long roomId) {
        User me = findUser(username);
        ChatRoom room = findRoom(roomId);
        checkAccess(room, me);

        // 내가 받은 안읽은 메시지 읽음 처리
        List<ChatMessage> unread = chatMessageRepository.findByRoomAndSenderNotAndReadByReceiverFalse(room, me);
        unread.forEach(msg -> msg.setReadByReceiver(true));
        chatMessageRepository.saveAll(unread);

        return chatMessageRepository.findByRoomOrderByCreatedAtAsc(room).stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(String username, Long roomId, SendMessageRequest req) {
        User me = findUser(username);
        ChatRoom room = findRoom(roomId);
        checkAccess(room, me);

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(me)
                .content(req.getContent())
                .build();

        return toMessageResponse(chatMessageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public long getTotalUnreadCount(String username) {
        User me = findUser(username);
        List<ChatRoom> rooms = chatRoomRepository.findByUser1OrUser2(me, me);
        return rooms.stream()
                .mapToLong(room -> chatMessageRepository.countByRoomAndSenderNotAndReadByReceiverFalse(room, me))
                .sum();
    }

    private ChatRoomResponse toRoomResponse(ChatRoom room, User me) {
        List<ChatMessage> messages = chatMessageRepository.findByRoomOrderByCreatedAtAsc(room);
        ChatMessage last = messages.isEmpty() ? null : messages.get(messages.size() - 1);
        long unread = chatMessageRepository.countByRoomAndSenderNotAndReadByReceiverFalse(room, me);

        return ChatRoomResponse.builder()
                .roomId(room.getId())
                .otherUsername(room.getOtherUser(me).getUsername())
                .lastMessage(last != null ? last.getContent() : null)
                .lastMessageAt(last != null ? last.getCreatedAt() : room.getCreatedAt())
                .unreadCount(unread)
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .senderUsername(msg.getSender().getUsername())
                .content(msg.getContent())
                .readByReceiver(msg.isReadByReceiver())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다: " + username));
    }

    private ChatRoom findRoom(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("채팅방을 찾을 수 없습니다."));
    }

    private void checkAccess(ChatRoom room, User me) {
        if (!room.getUser1().getId().equals(me.getId()) && !room.getUser2().getId().equals(me.getId())) {
            throw new UnauthorizedException("접근 권한이 없습니다.");
        }
    }
}
