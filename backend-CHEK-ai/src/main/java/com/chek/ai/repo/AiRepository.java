package com.chek.ai.repo;

import java.sql.PreparedStatement;
import java.sql.Statement;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class AiRepository {
  private final JdbcTemplate jdbcTemplate;

  public AiRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public long createSession(String userOneId) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_ai_session(user_one_id, created_at) VALUES(?, NOW())",
                  Statement.RETURN_GENERATED_KEYS);
          ps.setString(1, userOneId);
          return ps;
        },
        keyHolder);
    return keyHolder.getKey().longValue();
  }

  public void addMessage(long sessionId, String role, String content) {
    jdbcTemplate.update(
        "INSERT INTO chek_ai_message(session_id, role, content, created_at) VALUES(?, ?, ?, NOW())",
        sessionId,
        role,
        content);
  }
}

