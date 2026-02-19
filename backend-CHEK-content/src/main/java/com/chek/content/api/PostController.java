package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.comment.CommentDTO;
import com.chek.content.model.comment.CreateCommentRequest;
import com.chek.content.model.post.CreatePostRequest;
import com.chek.content.model.post.PostDTO;
import com.chek.content.repo.PostRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
      @RequestParam(name = "query", required = false) String query,
      @RequestParam(name = "tags", required = false) List<String> tags,
      @RequestParam(name = "authorUserOneId", required = false) String authorUserOneId,
      @RequestHeader(name = "X-User-One-Id", required = false) String viewerUserOneId,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
    return ResponseData.ok(postRepository.list(query, tags, authorUserOneId, viewerUserOneId, cursor, limit));
  }

  @GetMapping("/posts/{id}")
  public ResponseData<PostDTO> getPost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader) {
    PostDTO dto = postRepository.get(postId, userOneId);
    if (dto == null) return ResponseData.error("NOT_FOUND", "post not found");

    if (dto.isPublic() && dto.isIndexable()) return ResponseData.ok(dto);

    boolean isAdmin = isAdminHeader != null && isAdminHeader.equalsIgnoreCase("true");
    boolean isAuthor =
        userOneId != null && !userOneId.isBlank() && userOneId.equals(dto.getAuthorUserOneId());
    if (isAdmin || isAuthor) return ResponseData.ok(dto);
    return ResponseData.error("NOT_FOUND", "post not found");
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

  @DeleteMapping("/posts/{id}")
  public ResponseData<Boolean> deletePost(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader) {
    boolean isAdmin = isAdminHeader != null && isAdminHeader.equalsIgnoreCase("true");
    if (!isAdmin && (userOneId == null || userOneId.isBlank())) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }

    boolean ok = postRepository.delete(postId, userOneId, isAdmin);
    if (!ok) return ResponseData.error("FORBIDDEN", "not author/admin or not found");
    return ResponseData.ok(true);
  }

  @GetMapping("/posts/{id}/comments")
  public ResponseData<List<CommentDTO>> listComments(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "50") int limit) {
    PostDTO post = postRepository.get(postId);
    if (post == null) return ResponseData.error("NOT_FOUND", "post not found");

    if (!(post.isPublic() && post.isIndexable())) {
      boolean isAdmin = isAdminHeader != null && isAdminHeader.equalsIgnoreCase("true");
      boolean isAuthor =
          userOneId != null
              && !userOneId.isBlank()
              && userOneId.equals(post.getAuthorUserOneId());
      if (!(isAdmin || isAuthor)) {
        return ResponseData.error("NOT_FOUND", "post not found");
      }
    }

    return ResponseData.ok(postRepository.listComments(postId, cursor, limit));
  }

  @PostMapping("/posts/{id}/comments")
  public ResponseData<CommentDTO> createComment(
      @PathVariable("id") long postId,
      @RequestHeader(name = "X-User-One-Id", required = false) String userOneId,
      @Valid @RequestBody CreateCommentRequest req) {
    if (userOneId == null || userOneId.isBlank()) {
      return ResponseData.error("UNAUTHORIZED", "missing X-User-One-Id");
    }
    PostDTO post = postRepository.get(postId);
    if (post == null) return ResponseData.error("NOT_FOUND", "post not found");
    if (!(post.isPublic() && post.isIndexable())) {
      return ResponseData.error("NOT_FOUND", "post not found");
    }
    return ResponseData.ok(postRepository.createComment(postId, userOneId, req));
  }
}
