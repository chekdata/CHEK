package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.post.IngestExternalPostRequest;
import com.chek.content.model.post.PostDTO;
import com.chek.content.repo.PostRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/ingest")
public class IngestController {
  private final PostRepository postRepository;
  private final String ingestToken;

  public IngestController(
      PostRepository postRepository, @Value("${CHEK_INGEST_TOKEN:}") String ingestToken) {
    this.postRepository = postRepository;
    this.ingestToken = ingestToken == null ? "" : ingestToken.trim();
  }

  @PostMapping("/externalPosts:upsert")
  public ResponseData<PostDTO> upsertExternalPost(
      @RequestHeader(name = "X-Ingest-Token", required = false) String token,
      @Valid @RequestBody IngestExternalPostRequest req) {
    if (ingestToken.isBlank()) {
      return ResponseData.error("INGEST_DISABLED", "CHEK_INGEST_TOKEN not configured");
    }
    String t = token == null ? "" : token.trim();
    if (t.isBlank() || !t.equals(ingestToken)) {
      return ResponseData.error("UNAUTHORIZED", "invalid X-Ingest-Token");
    }
    try {
      return ResponseData.ok(postRepository.upsertExternal(req));
    } catch (IllegalArgumentException e) {
      return ResponseData.error("BAD_REQUEST", e.getMessage());
    }
  }
}

