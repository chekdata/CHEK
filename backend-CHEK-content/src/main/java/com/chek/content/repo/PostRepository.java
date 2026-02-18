package com.chek.content.repo;

import com.chek.content.model.post.CreatePostRequest;
import com.chek.content.model.post.PostDTO;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class PostRepository {
  private final JdbcTemplate jdbcTemplate;

  public PostRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<PostDTO> list(String type, String status, int limit) {
    StringBuilder sql =
        new StringBuilder(
            "SELECT id, type, status, title, body, ext_json, author_user_one_id, created_at "
                + "FROM chek_content_post WHERE 1=1 ");
    List<Object> args = new ArrayList<>();
    if (type != null && !type.isBlank()) {
      sql.append(" AND type = ? ");
      args.add(type);
    }
    if (status != null && !status.isBlank()) {
      sql.append(" AND status = ? ");
      args.add(status);
    }
    sql.append(" ORDER BY id DESC LIMIT ? ");
    args.add(Math.max(1, Math.min(limit, 100)));

    return jdbcTemplate.query(
        sql.toString(),
        (rs, rowNum) -> {
          PostDTO dto = new PostDTO();
          dto.setId(rs.getLong("id"));
          dto.setType(rs.getString("type"));
          dto.setStatus(rs.getString("status"));
          dto.setTitle(rs.getString("title"));
          dto.setBody(rs.getString("body"));
          dto.setExtJson(rs.getString("ext_json"));
          dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
          dto.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
          return dto;
        },
        args.toArray());
  }

  public PostDTO create(String userOneId, CreatePostRequest req) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_content_post(type, status, title, body, ext_json, author_user_one_id, created_at, updated_at) "
                      + "VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())",
                  Statement.RETURN_GENERATED_KEYS);
          ps.setString(1, req.getType());
          ps.setString(2, "OPEN");
          ps.setString(3, req.getTitle());
          ps.setString(4, req.getBody());
          ps.setString(5, req.getExtJson());
          ps.setString(6, userOneId);
          return ps;
        },
        keyHolder);
    long id = keyHolder.getKey().longValue();
    PostDTO dto = new PostDTO();
    dto.setId(id);
    dto.setType(req.getType());
    dto.setStatus("OPEN");
    dto.setTitle(req.getTitle());
    dto.setBody(req.getBody());
    dto.setExtJson(req.getExtJson());
    dto.setAuthorUserOneId(userOneId);
    dto.setCreatedAt("");
    return dto;
  }
}

