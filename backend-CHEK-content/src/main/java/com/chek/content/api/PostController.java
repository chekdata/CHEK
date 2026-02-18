package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.post.CreatePostRequest;
import com.chek.content.model.post.PostDTO;
import com.chek.content.repo.PostRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class PostController {
  private final PostRepository postRepository;

  public PostController(PostRepository postRepository) {
    this.postRepository = postRepository;
  }

  @GetMapping("/posts")
  public ResponseData<List<PostDTO>> listPosts(
      @RequestParam(name = "type", required = false) String type,
      @RequestParam(name = "status", required = false) String status,
      @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
    return ResponseData.ok(postRepository.list(type, status, limit));
  }

  @PostMapping("/posts")
  public ResponseData<PostDTO> createPost(
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @Valid @RequestBody CreatePostRequest req) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    return ResponseData.ok(postRepository.create(userOneId, req));
  }
}
