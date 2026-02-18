package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.post.PostDTO;
import com.chek.content.model.tag.TagDTO;
import com.chek.content.model.wiki.WikiEntryDTO;
import com.chek.content.repo.PostRepository;
import com.chek.content.repo.TagRepository;
import com.chek.content.repo.WikiRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/public/ssg")
public class PublicSsgController {
  private final WikiRepository wikiRepository;
  private final PostRepository postRepository;
  private final TagRepository tagRepository;

  public PublicSsgController(
      WikiRepository wikiRepository, PostRepository postRepository, TagRepository tagRepository) {
    this.wikiRepository = wikiRepository;
    this.postRepository = postRepository;
    this.tagRepository = tagRepository;
  }

  @GetMapping("/wiki")
  public ResponseData<List<WikiEntryDTO>> listWiki(
      @RequestParam(name = "updatedAfter", required = false) Instant updatedAfter,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "200") int limit) {
    return ResponseData.ok(wikiRepository.listPublicForSsg(updatedAfter, cursor, limit));
  }

  @GetMapping("/posts")
  public ResponseData<List<PostDTO>> listPosts(
      @RequestParam(name = "updatedAfter", required = false) Instant updatedAfter,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "200") int limit) {
    return ResponseData.ok(postRepository.listPublicForSsg(updatedAfter, cursor, limit));
  }

  @GetMapping("/tags")
  public ResponseData<List<TagDTO>> listTags(
      @RequestParam(name = "updatedAfter", required = false) Instant updatedAfter,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "500") int limit) {
    return ResponseData.ok(tagRepository.listForSsg(updatedAfter, cursor, limit));
  }
}

