package com.chek.content.repo;

import com.chek.content.model.wiki.CreateWikiEntryRequest;
import com.chek.content.model.wiki.WikiEntryDTO;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
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

  public List<WikiEntryDTO> list(String query, String entryType, int limit) {
    StringBuilder sql =
        new StringBuilder(
            "SELECT id, title, entry_type, summary, content_struct_json, status, created_at "
                + "FROM chek_content_wiki_entry WHERE 1=1 ");
    List<Object> args = new ArrayList<>();
    if (query != null && !query.isBlank()) {
      sql.append(" AND title LIKE ? ");
      args.add("%" + query.trim() + "%");
    }
    if (entryType != null && !entryType.isBlank()) {
      sql.append(" AND entry_type = ? ");
      args.add(entryType.trim());
    }
    sql.append(" ORDER BY id DESC LIMIT ? ");
    args.add(Math.max(1, Math.min(limit, 100)));

    return jdbcTemplate.query(
        sql.toString(),
        (rs, rowNum) -> {
          WikiEntryDTO dto = new WikiEntryDTO();
          dto.setId(rs.getLong("id"));
          dto.setTitle(rs.getString("title"));
          dto.setEntryType(rs.getString("entry_type"));
          dto.setSummary(rs.getString("summary"));
          dto.setContentStructJson(rs.getString("content_struct_json"));
          dto.setStatus(rs.getString("status"));
          dto.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
          return dto;
        },
        args.toArray());
  }

  public WikiEntryDTO get(long id) {
    List<WikiEntryDTO> list =
        jdbcTemplate.query(
            "SELECT id, title, entry_type, summary, content_struct_json, status, created_at "
                + "FROM chek_content_wiki_entry WHERE id = ?",
            (rs, rowNum) -> {
              WikiEntryDTO dto = new WikiEntryDTO();
              dto.setId(rs.getLong("id"));
              dto.setTitle(rs.getString("title"));
              dto.setEntryType(rs.getString("entry_type"));
              dto.setSummary(rs.getString("summary"));
              dto.setContentStructJson(rs.getString("content_struct_json"));
              dto.setStatus(rs.getString("status"));
              dto.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
              return dto;
            },
            id);
    return list.isEmpty() ? null : list.get(0);
  }

  public WikiEntryDTO create(CreateWikiEntryRequest req) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_content_wiki_entry(title, entry_type, summary, content_struct_json, status, created_at, updated_at) "
                      + "VALUES(?, ?, ?, ?, ?, NOW(), NOW())",
                  Statement.RETURN_GENERATED_KEYS);
          ps.setString(1, req.getTitle());
          ps.setString(2, req.getEntryType());
          ps.setString(3, req.getSummary());
          ps.setString(4, req.getContentStructJson());
          ps.setString(5, "PUBLISHED");
          return ps;
        },
        keyHolder);
    long id = keyHolder.getKey().longValue();
    WikiEntryDTO dto = new WikiEntryDTO();
    dto.setId(id);
    dto.setTitle(req.getTitle());
    dto.setEntryType(req.getEntryType());
    dto.setSummary(req.getSummary());
    dto.setContentStructJson(req.getContentStructJson());
    dto.setStatus("PUBLISHED");
    dto.setCreatedAt("");
    return dto;
  }
}

