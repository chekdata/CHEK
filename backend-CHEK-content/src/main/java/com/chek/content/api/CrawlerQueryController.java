package com.chek.content.api;

import com.chek.content.model.ResponseData;
import com.chek.content.model.crawler.CrawlerQueryDTO;
import com.chek.content.model.crawler.CrawlerQueryReportItem;
import com.chek.content.model.crawler.CrawlerQueryReportRequest;
import com.chek.content.model.crawler.CrawlerQuerySampleRequest;
import com.chek.content.model.crawler.CrawlerQueryUpsertRequest;
import com.chek.content.repo.CrawlerQueryRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/ingest")
public class CrawlerQueryController {
  private final CrawlerQueryRepository repo;
  private final String ingestToken;

  public CrawlerQueryController(
      CrawlerQueryRepository repo, @Value("${CHEK_INGEST_TOKEN:}") String ingestToken) {
    this.repo = repo;
    this.ingestToken = ingestToken == null ? "" : ingestToken.trim();
  }

  private boolean isAuthorized(String token) {
    if (ingestToken.isBlank()) return false;
    String t = token == null ? "" : token.trim();
    return !t.isBlank() && t.equals(ingestToken);
  }

  @PostMapping("/crawlerQueries:upsert")
  public ResponseData<Boolean> upsertSeeds(
      @RequestHeader(name = "X-Ingest-Token", required = false) String token,
      @Valid @RequestBody CrawlerQueryUpsertRequest req) {
    if (!isAuthorized(token)) return ResponseData.error("UNAUTHORIZED", "invalid X-Ingest-Token");
    repo.upsertSeeds(req.getPlatform(), req.getQueries());
    return ResponseData.ok(true);
  }

  @PostMapping("/crawlerQueries:sample")
  public ResponseData<List<String>> sample(
      @RequestHeader(name = "X-Ingest-Token", required = false) String token,
      @Valid @RequestBody CrawlerQuerySampleRequest req) {
    if (!isAuthorized(token)) return ResponseData.error("UNAUTHORIZED", "invalid X-Ingest-Token");
    int limit = req.getLimit() == null ? 10 : req.getLimit();
    return ResponseData.ok(repo.sampleQueries(req.getPlatform(), limit));
  }

  @PostMapping("/crawlerQueries:report")
  public ResponseData<Boolean> report(
      @RequestHeader(name = "X-Ingest-Token", required = false) String token,
      @Valid @RequestBody CrawlerQueryReportRequest req) {
    if (!isAuthorized(token)) return ResponseData.error("UNAUTHORIZED", "invalid X-Ingest-Token");
    for (CrawlerQueryReportItem it : req.getItems()) {
      repo.reportReward(req.getPlatform(), it.getQuery(), it.getReward(), it.getTrials());
    }
    return ResponseData.ok(true);
  }

  @PostMapping("/crawlerQueries:listTop")
  public ResponseData<List<CrawlerQueryDTO>> listTop(
      @RequestHeader(name = "X-Ingest-Token", required = false) String token,
      @Valid @RequestBody CrawlerQuerySampleRequest req) {
    if (!isAuthorized(token)) return ResponseData.error("UNAUTHORIZED", "invalid X-Ingest-Token");
    int limit = req.getLimit() == null ? 20 : req.getLimit();
    return ResponseData.ok(repo.listTop(req.getPlatform(), limit));
  }
}

