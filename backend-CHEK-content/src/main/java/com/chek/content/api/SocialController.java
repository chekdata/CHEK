package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.post.PostDTO;
import com.chek.content.model.social.FollowStatusDTO;
import com.chek.content.repo.PostRepository;
import com.chek.content.repo.SocialRepository;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class SocialController {
  private final PostRepository postRepository;
  private final SocialRepository socialRepository;

  public SocialController(PostRepository postRepository, SocialRepository socialRepository) {
    this.postRepository = postRepository;
    this.socialRepository = socialRepository;
  }

  @PostMapping("/posts/{id}/likes")
  public ResponseData<PostDTO> likePost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    PostDTO post = postRepository.get(postId, userOneId);
    if (post == null || !(post.isPublic() && post.isIndexable())) {
      return ResponseData.error("NOT_FOUND", "post not found");
    }

    socialRepository.likePost(postId, userOneId.trim());
    return ResponseData.ok(postRepository.get(postId, userOneId));
  }

  @DeleteMapping("/posts/{id}/likes")
  public ResponseData<PostDTO> unlikePost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    PostDTO post = postRepository.get(postId, userOneId);
    if (post == null || !(post.isPublic() && post.isIndexable())) {
      return ResponseData.error("NOT_FOUND", "post not found");
    }

    socialRepository.unlikePost(postId, userOneId.trim());
    return ResponseData.ok(postRepository.get(postId, userOneId));
  }

  @PostMapping("/posts/{id}/favorites")
  public ResponseData<PostDTO> favoritePost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    PostDTO post = postRepository.get(postId, userOneId);
    if (post == null || !(post.isPublic() && post.isIndexable())) {
      return ResponseData.error("NOT_FOUND", "post not found");
    }

    socialRepository.favoritePost(postId, userOneId.trim());
    return ResponseData.ok(postRepository.get(postId, userOneId));
  }

  @DeleteMapping("/posts/{id}/favorites")
  public ResponseData<PostDTO> unfavoritePost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    PostDTO post = postRepository.get(postId, userOneId);
    if (post == null || !(post.isPublic() && post.isIndexable())) {
      return ResponseData.error("NOT_FOUND", "post not found");
    }

    socialRepository.unfavoritePost(postId, userOneId.trim());
    return ResponseData.ok(postRepository.get(postId, userOneId));
  }

  @GetMapping("/me/favorites")
  public ResponseData<List<PostDTO>> listMyFavorites(
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    return ResponseData.ok(postRepository.listFavorites(userOneId, cursor, limit));
  }

  @GetMapping("/users/{userOneId}/followStatus")
  public ResponseData<FollowStatusDTO> getFollowStatus(
      @PathVariable("userOneId") String targetUserOneId,
      @RequestHeader(name = "X-User-One-Id", required = false) String viewerUserOneId) {
    FollowStatusDTO dto = new FollowStatusDTO();
    dto.setUserOneId(targetUserOneId);
    dto.setFollowerCount(socialRepository.followerCount(targetUserOneId));
    dto.setFollowing(socialRepository.isFollowing(viewerUserOneId, targetUserOneId));
    return ResponseData.ok(dto);
  }

  @PostMapping("/users/{userOneId}/follow")
  public ResponseData<Boolean> followUser(
      @PathVariable("userOneId") String targetUserOneId,
      @RequestHeader(name = "X-User-One-Id", required = false) String viewerUserOneId) {
    if (viewerUserOneId == null || viewerUserOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    boolean ok = socialRepository.followUser(viewerUserOneId, targetUserOneId);
    return ResponseData.ok(ok);
  }

  @DeleteMapping("/users/{userOneId}/follow")
  public ResponseData<Boolean> unfollowUser(
      @PathVariable("userOneId") String targetUserOneId,
      @RequestHeader(name = "X-User-One-Id", required = false) String viewerUserOneId) {
    if (viewerUserOneId == null || viewerUserOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    boolean ok = socialRepository.unfollowUser(viewerUserOneId, targetUserOneId);
    return ResponseData.ok(ok);
  }
}

