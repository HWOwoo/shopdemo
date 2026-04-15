package shop.inst.shopdemo.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import shop.inst.shopdemo.entity.enums.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String bio;
    private Role role;
    private String twitterUrl;
    private String pixivUrl;
    private String instagramUrl;
}
