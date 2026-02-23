package com.chek.content.repo;

import com.chek.content.model.crawler.CrawlerQueryDTO;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CrawlerQueryRepository {
  private final JdbcTemplate jdbcTemplate;
  private final Random random = new Random();

  public CrawlerQueryRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public void upsertSeeds(String platform, List<String> queries) {
    String p = platform == null ? "" : platform.trim();
    if (p.isBlank() || queries == null || queries.isEmpty()) return;
    for (String q0 : queries) {
      String q = q0 == null ? "" : q0.trim();
      if (q.isBlank()) continue;
      // Insert if not exists; keep existing alpha/beta.
      jdbcTemplate.update(
          "INSERT INTO chek_content_crawler_query_stat(platform, query_text, alpha, beta, created_at, updated_at) "
              + "VALUES(?, ?, 1.0, 1.0, NOW(), NOW()) "
              + "ON DUPLICATE KEY UPDATE updated_at = updated_at",
          p,
          q);
    }
  }

  public List<String> sampleQueries(String platform, int limit) {
    int n = Math.max(1, Math.min(limit, 200));
    String p = platform == null ? "" : platform.trim();
    if (p.isBlank()) return List.of();

    List<Row> rows =
        jdbcTemplate.query(
            "SELECT platform, query_text, alpha, beta, updated_at FROM chek_content_crawler_query_stat WHERE platform = ?",
            (rs, rowNum) ->
                new Row(
                    rs.getString("platform"),
                    rs.getString("query_text"),
                    rs.getDouble("alpha"),
                    rs.getDouble("beta"),
                    rs.getTimestamp("updated_at") == null
                        ? Instant.EPOCH
                        : rs.getTimestamp("updated_at").toInstant()),
            p);

    if (rows.isEmpty()) return List.of();

    double totalPulls = 0.0;
    for (Row r : rows) totalPulls += Math.max(0.0, (r.alpha - 1.0) + (r.beta - 1.0));

    // UCB-like score: mean + exploration
    final double t = Math.max(1.0, totalPulls);
    for (Row r : rows) {
      double pulls = Math.max(0.0, (r.alpha - 1.0) + (r.beta - 1.0));
      double mean = r.alpha / Math.max(1e-9, (r.alpha + r.beta));
      double explore = Math.sqrt(Math.log(t + 1.0) / (pulls + 1.0));
      // small jitter to avoid sticky ties
      r.score = mean + 0.35 * explore + (random.nextDouble() * 0.0005);
    }

    rows.sort(Comparator.comparingDouble((Row r) -> r.score).reversed());

    List<String> out = new ArrayList<>();
    for (Row r : rows) {
      if (out.size() >= n) break;
      String q = r.query == null ? "" : r.query.trim();
      if (!q.isBlank()) out.add(q);
    }
    return out;
  }

  public void reportReward(String platform, String query, double reward, int trials) {
    String p = platform == null ? "" : platform.trim();
    String q = query == null ? "" : query.trim();
    if (p.isBlank() || q.isBlank()) return;

    double r = Math.max(0.0, Math.min(1.0, reward));
    int w = Math.max(1, Math.min(trials, 10000));
    double success = r * w;
    double fail = (1.0 - r) * w;

    jdbcTemplate.update(
        "INSERT INTO chek_content_crawler_query_stat(platform, query_text, alpha, beta, last_reward, created_at, updated_at) "
            + "VALUES(?, ?, ?, ?, ?, NOW(), NOW()) "
            + "ON DUPLICATE KEY UPDATE alpha = alpha + ?, beta = beta + ?, last_reward = ?, updated_at = NOW()",
        p,
        q,
        1.0 + success,
        1.0 + fail,
        r,
        success,
        fail,
        r);
  }

  public List<CrawlerQueryDTO> listTop(String platform, int limit) {
    int n = Math.max(1, Math.min(limit, 200));
    String p = platform == null ? "" : platform.trim();
    if (p.isBlank()) return List.of();
    return jdbcTemplate.query(
        "SELECT platform, query_text, alpha, beta FROM chek_content_crawler_query_stat WHERE platform = ? ORDER BY updated_at DESC LIMIT ?",
        (rs, rowNum) -> {
          CrawlerQueryDTO dto = new CrawlerQueryDTO();
          dto.setPlatform(rs.getString("platform"));
          dto.setQuery(rs.getString("query_text"));
          double a = rs.getDouble("alpha");
          double b = rs.getDouble("beta");
          dto.setAlpha(a);
          dto.setBeta(b);
          dto.setMeanReward(a / Math.max(1e-9, (a + b)));
          return dto;
        },
        p,
        n);
  }

  private static class Row {
    final String platform;
    final String query;
    final double alpha;
    final double beta;
    final Instant updatedAt;
    double score;

    Row(String platform, String query, double alpha, double beta, Instant updatedAt) {
      this.platform = platform;
      this.query = query;
      this.alpha = alpha;
      this.beta = beta;
      this.updatedAt = updatedAt;
      this.score = 0.0;
    }
  }
}

