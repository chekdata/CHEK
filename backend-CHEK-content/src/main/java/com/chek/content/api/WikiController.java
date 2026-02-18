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
      @RequestParam(name = "entryType", required = false) String entryType,
      @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
    return ResponseData.ok(wikiRepository.list(query, entryType, limit));
  }

  @GetMapping("/entries/{id}")
  public ResponseData<WikiEntryDTO> getEntry(@PathVariable("id") long id) {
    WikiEntryDTO dto = wikiRepository.get(id);
    if (dto == null) return ResponseData.error("NOT_FOUND", "wiki entry not found");
    return ResponseData.ok(dto);
  }

  @PostMapping("/entries")
  public ResponseData<WikiEntryDTO> createEntry(@Valid @RequestBody CreateWikiEntryRequest req) {
    return ResponseData.ok(wikiRepository.create(req));
  }
}
