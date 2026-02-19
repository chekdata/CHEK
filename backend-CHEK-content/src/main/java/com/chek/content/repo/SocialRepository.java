package com.chek.content.repo;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SocialRepository {
  private final JdbcTemplate jdbcTemplate;

  public SocialRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public boolean likePost(long postId, String userOneId) {
    try {
      int updated =
          jdbcTemplate.update(
              "INSERT INTO chek_content_post_like(post_id, user_one_id) VALUES(?, ?)",
              postId,
              userOneId);
      return updated > 0;
    } catch (DataIntegrityViolationException ignored) {
      return false;
    }
  }

  public boolean unlikePost(long postId, String userOneId) {
    int updated =
        jdbcTemplate.update(
            "DELETE FROM chek_content_post_like WHERE post_id = ? AND user_one_id = ?",
            postId,
            userOneId);
    return updated > 0;
  }

  public boolean favoritePost(long postId, String userOneId) {
    try {
      int updated =
          jdbcTemplate.update(
              "INSERT INTO chek_content_post_favorite(post_id, user_one_id) VALUES(?, ?)",
              postId,
              userOneId);
      return updated > 0;
    } catch (DataIntegrityViolationException ignored) {
      return false;
    }
  }

  public boolean unfavoritePost(long postId, String userOneId) {
    int updated =
        jdbcTemplate.update(
            "DELETE FROM chek_content_post_favorite WHERE post_id = ? AND user_one_id = ?",
            postId,
            userOneId);
    return updated > 0;
  }

  public boolean followUser(String followerUserOneId, String followeeUserOneId) {
    if (followerUserOneId == null || followerUserOneId.isBlank()) return false;
    if (followeeUserOneId == null || followeeUserOneId.isBlank()) return false;
    if (followerUserOneId.trim().equals(followeeUserOneId.trim())) return false;
    try {
      int updated =
          jdbcTemplate.update(
              "INSERT INTO chek_content_user_follow(follower_user_one_id, followee_user_one_id) VALUES(?, ?)",
              followerUserOneId.trim(),
              followeeUserOneId.trim());
      return updated > 0;
    } catch (DataIntegrityViolationException ignored) {
      return false;
    }
  }

  public boolean unfollowUser(String followerUserOneId, String followeeUserOneId) {
    if (followerUserOneId == null || followerUserOneId.isBlank()) return false;
    if (followeeUserOneId == null || followeeUserOneId.isBlank()) return false;
    int updated =
        jdbcTemplate.update(
            "DELETE FROM chek_content_user_follow WHERE follower_user_one_id = ? AND followee_user_one_id = ?",
            followerUserOneId.trim(),
            followeeUserOneId.trim());
    return updated > 0;
  }

  public boolean isFollowing(String followerUserOneId, String followeeUserOneId) {
    if (followerUserOneId == null || followerUserOneId.isBlank()) return false;
    if (followeeUserOneId == null || followeeUserOneId.isBlank()) return false;
    Integer one =
        jdbcTemplate.query(
                "SELECT 1 FROM chek_content_user_follow WHERE follower_user_one_id = ? AND followee_user_one_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getInt(1),
                followerUserOneId.trim(),
                followeeUserOneId.trim())
            .stream()
            .findFirst()
            .orElse(null);
    return one != null && one == 1;
  }

  public long followerCount(String followeeUserOneId) {
    if (followeeUserOneId == null || followeeUserOneId.isBlank()) return 0L;
    Long n =
        jdbcTemplate.query(
                "SELECT COUNT(1) FROM chek_content_user_follow WHERE followee_user_one_id = ?",
                (rs, rowNum) -> rs.getLong(1),
                followeeUserOneId.trim())
            .stream()
            .findFirst()
            .orElse(0L);
    return n == null ? 0L : n;
  }
}

