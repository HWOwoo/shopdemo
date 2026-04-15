package shop.inst.shopdemo.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 500)
    private String bio;

    @Size(max = 200)
    private String twitterUrl;

    @Size(max = 200)
    private String pixivUrl;

    @Size(max = 200)
    private String instagramUrl;
}
