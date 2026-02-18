package com.chek.media.repo;

import java.sql.PreparedStatement;
import java.sql.Statement;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class MediaRepository {
  private final JdbcTemplate jdbcTemplate;

  public MediaRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public long createObject(
      String bucket,
      String objectKey,
      String contentType,
      Long sizeBytes,
      String uploaderUserOneId,
      String status) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_media_object(bucket, object_key, content_type, size_bytes, uploader_user_one_id, status, created_at, updated_at) "
                      + "VALUES(?, ?, ?, ?, ?, ?, NOW(), NOW())",
                  Statement.RETURN_GENERATED_KEYS);
          ps.setString(1, bucket);
          ps.setString(2, objectKey);
          ps.setString(3, contentType);
          if (sizeBytes == null) ps.setObject(4, null);
          else ps.setLong(4, sizeBytes);
          ps.setString(5, uploaderUserOneId);
          ps.setString(6, status);
          return ps;
        },
        keyHolder);
    return keyHolder.getKey().longValue();
  }
}

