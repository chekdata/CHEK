package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.wiki.CreateWikiEntryRequest;
import com.chek.content.model.wiki.WikiEntryDTO;
import com.chek.content.repo.WikiRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/wiki")
public class WikiController {
  private final WikiRepository wikiRepository;

  public WikiController(WikiRepository wikiRepository) {
    this.wikiRepository = wikiRepository;
  }

  @GetMapping("/entries")
  public ResponseData<List<WikiEntryDTO>> listEntries(
      @RequestParam(name = "query", required = false) String query,
      @RequestParam(name = "tags", required = false) List<String> tags,
      @RequestParam(name = "cursor", required = false) Long cursor,
      @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
    return ResponseData.ok(wikiRepository.list(query, tags, cursor, limit));
  }

  @GetMapping("/entries/bySlug/{slug}")
  public ResponseData<WikiEntryDTO> getEntryBySlug(
      @PathVariable("slug") String slug,
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader) {
    WikiEntryDTO dto = wikiRepository.getBySlug(slug);
    if (dto == null) return ResponseData.error("NOT_FOUND", "wiki entry not found");

    if (dto.isPublic() && dto.isIndexable()) return ResponseData.ok(dto);

    boolean isAdmin = isAdminHeader != null && isAdminHeader.equalsIgnoreCase("true");
    if (isAdmin) return ResponseData.ok(dto);
    return ResponseData.error("NOT_FOUND", "wiki entry not found");
  }

  @GetMapping("/entries/{id}")
  public ResponseData<WikiEntryDTO> getEntry(
      @PathVariable("id") long id,
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader) {
    WikiEntryDTO dto = wikiRepository.get(id);
    if (dto == null) return ResponseData.error("NOT_FOUND", "wiki entry not found");
    if (dto.isPublic() && dto.isIndexable()) return ResponseData.ok(dto);

    boolean isAdmin = isAdminHeader != null && isAdminHeader.equalsIgnoreCase("true");
    if (isAdmin) return ResponseData.ok(dto);
    return ResponseData.error("NOT_FOUND", "wiki entry not found");
  }

  @PostMapping("/entries")
  public ResponseData<WikiEntryDTO> createEntry(
      @RequestHeader(name = "X-Is-Admin", required = false) String isAdminHeader,
      @Valid @RequestBody CreateWikiEntryRequest req) {
    if (isAdminHeader == null || !isAdminHeader.equalsIgnoreCase("true")) {
      return ResponseData.error("FORBIDDEN", "admin only");
    }
    return ResponseData.ok(wikiRepository.create(req));
  }
}
