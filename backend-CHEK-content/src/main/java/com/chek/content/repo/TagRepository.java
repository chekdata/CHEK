package com.chek.content.repo;

import com.chek.content.model.tag.TagDTO;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TagRepository {
  private final JdbcTemplate jdbcTemplate;

  public TagRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<TagDTO> listForSsg(Instant updatedAfter, Long cursor, int limit) {
    int n = Math.max(1, Math.min(limit, 500));
    long cur = cursor == null ? 0L : cursor;
    List<Object> args = new ArrayList<>();

    StringBuilder sql =
        new StringBuilder("SELECT id, name, created_at FROM chek_content_tag WHERE 1=1 ");
    if (updatedAfter != null) {
      sql.append("AND created_at > ? ");
      args.add(Timestamp.from(updatedAfter));
    }
    if (cur > 0) {
      sql.append("AND id < ? ");
      args.add(cur);
    }
    sql.append("ORDER BY id DESC LIMIT ? ");
    args.add(n);

    return jdbcTemplate.query(
        sql.toString(),
        (rs, rowNum) -> {
          TagDTO dto = new TagDTO();
          dto.setTagId(rs.getLong("id"));
          dto.setName(rs.getString("name"));
          Timestamp createdAt = rs.getTimestamp("created_at");
          dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
          return dto;
        },
        args.toArray());
  }
}

