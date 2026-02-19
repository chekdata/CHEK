package com.chek.content.repo;

import com.chek.content.model.wiki.CreateWikiEntryRequest;
import com.chek.content.model.wiki.WikiEntryDTO;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class WikiRepository {
  private final JdbcTemplate jdbcTemplate;

  public WikiRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<WikiEntryDTO> list(String query, List<String> tags, Long cursor, int limit) {
    int n = Math.max(1, Math.min(limit, 100));
    long cur = cursor == null ? 0L : cursor;
    List<String> tagNames = normalizeTags(tags);

    StringBuilder sql = new StringBuilder();
    List<Object> args = new ArrayList<>();

    sql.append("SELECT ");
    if (!tagNames.isEmpty()) {
      sql.append("DISTINCT ");
    }
    sql.append(
        "e.id, e.slug, e.title, e.summary, e.is_public, e.is_indexable, e.published_at, e.created_at, e.updated_at "
            + "FROM chek_content_wiki_entry e ");

    if (!tagNames.isEmpty()) {
      sql.append(
          "JOIN chek_content_wiki_entry_tag et ON e.id = et.entry_id "
              + "JOIN chek_content_tag t ON et.tag_id = t.id ");
    }

    sql.append("WHERE e.is_public = TRUE AND e.is_indexable = TRUE ");

    if (cur > 0) {
      sql.append("AND e.id < ? ");
      args.add(cur);
    }

    if (query != null && !query.isBlank()) {
      sql.append("AND (e.title LIKE ? OR e.summary LIKE ? OR e.body_md LIKE ?) ");
      String q = "%" + query.trim() + "%";
      args.add(q);
      args.add(q);
      args.add(q);
    }

    if (!tagNames.isEmpty()) {
      sql.append("AND t.name IN (");
      sql.append(String.join(",", Collections.nCopies(tagNames.size(), "?")));
      sql.append(") ");
      args.addAll(tagNames);
    }

    sql.append("ORDER BY e.id DESC LIMIT ? ");
    args.add(n);

    List<WikiEntryDTO> list =
        jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> {
              WikiEntryDTO dto = new WikiEntryDTO();
              dto.setEntryId(rs.getLong("id"));
              dto.setSlug(rs.getString("slug"));
              dto.setTitle(rs.getString("title"));
              dto.setSummary(rs.getString("summary"));
              dto.setBody(null);
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              Timestamp publishedAt = rs.getTimestamp("published_at");
              dto.setPublishedAt(publishedAt == null ? null : publishedAt.toInstant());
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    for (WikiEntryDTO dto : list) {
      dto.setTags(listTagNamesByEntryId(dto.getEntryId()));
    }
    return list;
  }

  public WikiEntryDTO get(long entryId) {
    List<WikiEntryDTO> list =
        jdbcTemplate.query(
            "SELECT id, slug, title, summary, body_md, is_public, is_indexable, published_at, created_at, updated_at "
                + "FROM chek_content_wiki_entry WHERE id = ?",
            (rs, rowNum) -> {
              WikiEntryDTO dto = new WikiEntryDTO();
              dto.setEntryId(rs.getLong("id"));
              dto.setSlug(rs.getString("slug"));
              dto.setTitle(rs.getString("title"));
              dto.setSummary(rs.getString("summary"));
              dto.setBody(rs.getString("body_md"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              Timestamp publishedAt = rs.getTimestamp("published_at");
              dto.setPublishedAt(publishedAt == null ? null : publishedAt.toInstant());
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            entryId);

    if (list.isEmpty()) return null;
    WikiEntryDTO dto = list.get(0);
    dto.setTags(listTagNamesByEntryId(dto.getEntryId()));
    return dto;
  }

  public WikiEntryDTO getBySlug(String slug) {
    if (slug == null || slug.isBlank()) return null;
    List<WikiEntryDTO> list =
        jdbcTemplate.query(
            "SELECT id, slug, title, summary, body_md, is_public, is_indexable, published_at, created_at, updated_at "
                + "FROM chek_content_wiki_entry WHERE slug = ?",
            (rs, rowNum) -> {
              WikiEntryDTO dto = new WikiEntryDTO();
              dto.setEntryId(rs.getLong("id"));
              dto.setSlug(rs.getString("slug"));
              dto.setTitle(rs.getString("title"));
              dto.setSummary(rs.getString("summary"));
              dto.setBody(rs.getString("body_md"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              Timestamp publishedAt = rs.getTimestamp("published_at");
              dto.setPublishedAt(publishedAt == null ? null : publishedAt.toInstant());
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            slug.trim());

    if (list.isEmpty()) return null;
    WikiEntryDTO dto = list.get(0);
    dto.setTags(listTagNamesByEntryId(dto.getEntryId()));
    return dto;
  }

  public WikiEntryDTO create(CreateWikiEntryRequest req) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_content_wiki_entry(slug, title, summary, body_md, is_public, is_indexable, published_at, created_at, updated_at) "
                      + "VALUES(?, ?, ?, ?, TRUE, TRUE, NOW(), NOW(), NOW())",
                  new String[] {"id"});
          ps.setString(1, req.getSlug());
          ps.setString(2, req.getTitle());
          ps.setString(3, req.getSummary());
          ps.setString(4, req.getBody());
          return ps;
        },
        keyHolder);
    long id = keyHolder.getKey().longValue();
    upsertEntryTags(id, req.getTags());
    return get(id);
  }

  public WikiEntryDTO update(long entryId, CreateWikiEntryRequest req) {
    int updated =
        jdbcTemplate.update(
            "UPDATE chek_content_wiki_entry SET slug = ?, title = ?, summary = ?, body_md = ?, updated_at = NOW() "
                + "WHERE id = ?",
            req.getSlug(),
            req.getTitle(),
            req.getSummary(),
            req.getBody(),
            entryId);
    if (updated <= 0) return null;

    jdbcTemplate.update("DELETE FROM chek_content_wiki_entry_tag WHERE entry_id = ?", entryId);
    upsertEntryTags(entryId, req.getTags());
    return get(entryId);
  }

  public List<WikiEntryDTO> listPublicForSsg(Instant updatedAfter, Long cursor, int limit) {
    int n = Math.max(1, Math.min(limit, 200));
    long cur = cursor == null ? 0L : cursor;
    List<Object> args = new ArrayList<>();

    StringBuilder sql =
        new StringBuilder(
            "SELECT id, slug, title, summary, body_md, is_public, is_indexable, published_at, created_at, updated_at "
                + "FROM chek_content_wiki_entry WHERE is_public = TRUE AND is_indexable = TRUE ");

    if (updatedAfter != null) {
      sql.append("AND updated_at > ? ");
      args.add(Timestamp.from(updatedAfter));
    }
    if (cur > 0) {
      sql.append("AND id < ? ");
      args.add(cur);
    }

    sql.append("ORDER BY id DESC LIMIT ? ");
    args.add(n);

    List<WikiEntryDTO> list =
        jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> {
              WikiEntryDTO dto = new WikiEntryDTO();
              dto.setEntryId(rs.getLong("id"));
              dto.setSlug(rs.getString("slug"));
              dto.setTitle(rs.getString("title"));
              dto.setSummary(rs.getString("summary"));
              dto.setBody(rs.getString("body_md"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              Timestamp publishedAt = rs.getTimestamp("published_at");
              dto.setPublishedAt(publishedAt == null ? null : publishedAt.toInstant());
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    for (WikiEntryDTO dto : list) {
      dto.setTags(listTagNamesByEntryId(dto.getEntryId()));
    }
    return list;
  }

  private void upsertEntryTags(long entryId, List<String> tags) {
    List<String> tagNames = normalizeTags(tags);
    if (tagNames.isEmpty()) return;

    for (String name : tagNames) {
      Long tagId = findOrCreateTagId(name);
      if (tagId == null) continue;
      try {
        jdbcTemplate.update(
            "INSERT INTO chek_content_wiki_entry_tag(entry_id, tag_id) VALUES(?, ?)",
            entryId,
            tagId);
      } catch (DataIntegrityViolationException ignored) {
        // ignore duplicate
      }
    }
  }

  private List<String> listTagNamesByEntryId(long entryId) {
    return jdbcTemplate.query(
        "SELECT t.name FROM chek_content_tag t "
            + "JOIN chek_content_wiki_entry_tag et ON t.id = et.tag_id "
            + "WHERE et.entry_id = ? ORDER BY t.id ASC",
        (rs, rowNum) -> rs.getString("name"),
        entryId);
  }

  private Long findOrCreateTagId(String name) {
    List<Long> existing =
        jdbcTemplate.query(
            "SELECT id FROM chek_content_tag WHERE name = ?",
            (rs, rowNum) -> rs.getLong("id"),
            name);
    if (!existing.isEmpty()) return existing.get(0);

    try {
      jdbcTemplate.update("INSERT INTO chek_content_tag(name) VALUES(?)", name);
    } catch (DataIntegrityViolationException ignored) {
      // ignore duplicate
    }

    List<Long> again =
        jdbcTemplate.query(
            "SELECT id FROM chek_content_tag WHERE name = ?",
            (rs, rowNum) -> rs.getLong("id"),
            name);
    return again.isEmpty() ? null : again.get(0);
  }

  private static List<String> normalizeTags(List<String> tags) {
    if (tags == null || tags.isEmpty()) return Collections.emptyList();
    List<String> out = new ArrayList<>();
    for (String t : tags) {
      if (t == null) continue;
      String s = t.trim();
      if (s.isEmpty()) continue;
      out.add(s);
    }
    return out.stream().distinct().toList();
  }
}
