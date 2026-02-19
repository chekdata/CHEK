package com.chek.content.repo;

import com.chek.content.model.comment.CommentDTO;
import com.chek.content.model.comment.CreateCommentRequest;
import com.chek.content.model.post.CreatePostRequest;
import com.chek.content.model.post.CreatePostMediaItem;
import com.chek.content.model.post.PostDTO;
import com.chek.content.model.post.PostMediaDTO;
import java.math.BigDecimal;
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
public class PostRepository {
  private final JdbcTemplate jdbcTemplate;

  public PostRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<PostDTO> list(
      String query,
      List<String> tags,
      String authorUserOneId,
      String viewerUserOneId,
      Long cursor,
      int limit) {
    int n = Math.max(1, Math.min(limit, 100));
    long cur = cursor == null ? 0L : cursor;
    List<String> tagNames = normalizeTags(tags);
    String viewer = viewerUserOneId == null ? "" : viewerUserOneId.trim();
    boolean hasViewer = !viewer.isBlank();

    StringBuilder sql = new StringBuilder();
    List<Object> args = new ArrayList<>();

    sql.append("SELECT ");
    if (!tagNames.isEmpty()) {
      sql.append("DISTINCT ");
    }
    sql.append(
        "p.id, p.title, p.body_md, p.location_name, p.lng, p.lat, p.occurred_at, "
            + "p.author_user_one_id, p.is_public, p.is_indexable, p.created_at, p.updated_at, "
            + "(SELECT COUNT(1) FROM chek_content_comment c WHERE c.post_id = p.id) AS comment_count, "
            + "(SELECT COUNT(1) FROM chek_content_post_like l WHERE l.post_id = p.id) AS like_count, "
            + "(SELECT COUNT(1) FROM chek_content_post_favorite f WHERE f.post_id = p.id) AS favorite_count, ");

    if (hasViewer) {
      sql.append(
          "EXISTS(SELECT 1 FROM chek_content_post_like l2 WHERE l2.post_id = p.id AND l2.user_one_id = ?) AS liked_by_me, "
              + "EXISTS(SELECT 1 FROM chek_content_post_favorite f2 WHERE f2.post_id = p.id AND f2.user_one_id = ?) AS favorited_by_me ");
      args.add(viewer);
      args.add(viewer);
    } else {
      sql.append("FALSE AS liked_by_me, FALSE AS favorited_by_me ");
    }

    sql.append("FROM chek_content_post p ");

    if (!tagNames.isEmpty()) {
      sql.append(
          "JOIN chek_content_post_tag pt ON p.id = pt.post_id "
              + "JOIN chek_content_tag t ON pt.tag_id = t.id ");
    }

    sql.append("WHERE p.is_public = TRUE ");
    sql.append("AND p.is_indexable = TRUE ");

    if (cur > 0) {
      sql.append("AND p.id < ? ");
      args.add(cur);
    }

    if (query != null && !query.isBlank()) {
      sql.append("AND (p.title LIKE ? OR p.body_md LIKE ?) ");
      String q = "%" + query.trim() + "%";
      args.add(q);
      args.add(q);
    }

    if (authorUserOneId != null && !authorUserOneId.isBlank()) {
      sql.append("AND p.author_user_one_id = ? ");
      args.add(authorUserOneId.trim());
    }

    if (!tagNames.isEmpty()) {
      sql.append("AND t.name IN (");
      sql.append(String.join(",", Collections.nCopies(tagNames.size(), "?")));
      sql.append(") ");
      args.addAll(tagNames);
    }

    sql.append("ORDER BY p.id DESC LIMIT ? ");
    args.add(n);

    List<PostDTO> list =
        jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> {
              PostDTO dto = new PostDTO();
              dto.setPostId(rs.getLong("id"));
              dto.setTitle(rs.getString("title"));
              dto.setBody(rs.getString("body_md"));
              dto.setLocationName(rs.getString("location_name"));
              dto.setLng(toNullableDouble(rs.getBigDecimal("lng")));
              dto.setLat(toNullableDouble(rs.getBigDecimal("lat")));
              Timestamp occurredAt = rs.getTimestamp("occurred_at");
              dto.setOccurredAt(occurredAt == null ? null : occurredAt.toInstant());
              dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              dto.setCommentCount(rs.getLong("comment_count"));
              dto.setLikeCount(rs.getLong("like_count"));
              dto.setFavoriteCount(rs.getLong("favorite_count"));
              dto.setLikedByMe(rs.getBoolean("liked_by_me"));
              dto.setFavoritedByMe(rs.getBoolean("favorited_by_me"));
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    for (PostDTO dto : list) {
      dto.setTags(listTagNamesByPostId(dto.getPostId()));
      dto.setMedia(listMediaByPostId(dto.getPostId()));
    }
    return list;
  }

  public PostDTO get(long postId) {
    return get(postId, null);
  }

  public PostDTO get(long postId, String viewerUserOneId) {
    String viewer = viewerUserOneId == null ? "" : viewerUserOneId.trim();
    boolean hasViewer = !viewer.isBlank();
    List<Object> args = new ArrayList<>();

    if (hasViewer) {
      args.add(viewer);
      args.add(viewer);
    }
    args.add(postId);

    List<PostDTO> list =
        jdbcTemplate.query(
            "SELECT p.id, p.title, p.body_md, p.location_name, p.lng, p.lat, p.occurred_at, "
                + "p.author_user_one_id, p.is_public, p.is_indexable, p.created_at, p.updated_at, "
                + "(SELECT COUNT(1) FROM chek_content_comment c WHERE c.post_id = p.id) AS comment_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_like l WHERE l.post_id = p.id) AS like_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_favorite f WHERE f.post_id = p.id) AS favorite_count, "
                + (hasViewer
                    ? "EXISTS(SELECT 1 FROM chek_content_post_like l2 WHERE l2.post_id = p.id AND l2.user_one_id = ?) AS liked_by_me, "
                        + "EXISTS(SELECT 1 FROM chek_content_post_favorite f2 WHERE f2.post_id = p.id AND f2.user_one_id = ?) AS favorited_by_me "
                    : "FALSE AS liked_by_me, FALSE AS favorited_by_me ")
                + "FROM chek_content_post p WHERE p.id = ?",
            (rs, rowNum) -> {
              PostDTO dto = new PostDTO();
              dto.setPostId(rs.getLong("id"));
              dto.setTitle(rs.getString("title"));
              dto.setBody(rs.getString("body_md"));
              dto.setLocationName(rs.getString("location_name"));
              dto.setLng(toNullableDouble(rs.getBigDecimal("lng")));
              dto.setLat(toNullableDouble(rs.getBigDecimal("lat")));
              Timestamp occurredAt = rs.getTimestamp("occurred_at");
              dto.setOccurredAt(occurredAt == null ? null : occurredAt.toInstant());
              dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              dto.setCommentCount(rs.getLong("comment_count"));
              dto.setLikeCount(rs.getLong("like_count"));
              dto.setFavoriteCount(rs.getLong("favorite_count"));
              dto.setLikedByMe(rs.getBoolean("liked_by_me"));
              dto.setFavoritedByMe(rs.getBoolean("favorited_by_me"));
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    if (list.isEmpty()) return null;
    PostDTO dto = list.get(0);
    dto.setTags(listTagNamesByPostId(dto.getPostId()));
    dto.setMedia(listMediaByPostId(dto.getPostId()));
    return dto;
  }

  public PostDTO create(String userOneId, CreatePostRequest req) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_content_post(title, body_md, is_public, is_indexable, occurred_at, location_name, lng, lat, author_user_one_id, created_at, updated_at) "
                      + "VALUES(?, ?, TRUE, TRUE, ?, ?, ?, ?, ?, NOW(), NOW())",
                  new String[] {"id"});
          ps.setString(1, req.getTitle());
          ps.setString(2, req.getBody());
          Instant occurredAt = req.getOccurredAt();
          ps.setTimestamp(3, occurredAt == null ? null : Timestamp.from(occurredAt));
          ps.setString(4, req.getLocationName());
          ps.setBigDecimal(5, req.getLng() == null ? null : BigDecimal.valueOf(req.getLng()));
          ps.setBigDecimal(6, req.getLat() == null ? null : BigDecimal.valueOf(req.getLat()));
          ps.setString(7, userOneId);
          return ps;
        },
        keyHolder);
    long id = keyHolder.getKey().longValue();

    upsertPostTags(id, req.getTags());
    upsertPostMedia(id, req.getMedia());
    return get(id);
  }

  public boolean delete(long postId, String userOneId, boolean isAdmin) {
    int updated;
    if (isAdmin) {
      updated =
          jdbcTemplate.update(
              "UPDATE chek_content_post SET is_public = FALSE, is_indexable = FALSE, updated_at = NOW() "
                  + "WHERE id = ?",
              postId);
    } else {
      updated =
          jdbcTemplate.update(
              "UPDATE chek_content_post SET is_public = FALSE, is_indexable = FALSE, updated_at = NOW() "
                  + "WHERE id = ? AND author_user_one_id = ?",
              postId,
              userOneId);
    }
    return updated > 0;
  }

  public List<CommentDTO> listComments(long postId, Long cursor, int limit) {
    long cur = cursor == null ? Long.MAX_VALUE : cursor;
    int n = Math.max(1, Math.min(limit, 100));
    return jdbcTemplate.query(
        "SELECT id, post_id, body, author_user_one_id, parent_comment_id, created_at "
            + "FROM chek_content_comment WHERE post_id = ? AND id < ? ORDER BY id DESC LIMIT ?",
        (rs, rowNum) -> {
          CommentDTO dto = new CommentDTO();
          dto.setCommentId(rs.getLong("id"));
          dto.setPostId(rs.getLong("post_id"));
          dto.setBody(rs.getString("body"));
          dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
          long parentId = rs.getLong("parent_comment_id");
          dto.setParentCommentId(rs.wasNull() ? null : parentId);
          Timestamp createdAt = rs.getTimestamp("created_at");
          dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
          return dto;
        },
        postId,
        cur,
        n);
  }

  public CommentDTO createComment(long postId, String userOneId, CreateCommentRequest req) {
    KeyHolder keyHolder = new GeneratedKeyHolder();
    jdbcTemplate.update(
        conn -> {
          PreparedStatement ps =
              conn.prepareStatement(
                  "INSERT INTO chek_content_comment(post_id, body, author_user_one_id, parent_comment_id, created_at, updated_at) "
                      + "VALUES(?, ?, ?, ?, NOW(), NOW())",
                  new String[] {"id"});
          ps.setLong(1, postId);
          ps.setString(2, req.getBody());
          ps.setString(3, userOneId);
          if (req.getParentCommentId() == null) {
            ps.setObject(4, null);
          } else {
            ps.setLong(4, req.getParentCommentId());
          }
          return ps;
        },
        keyHolder);
    long id = keyHolder.getKey().longValue();
    List<CommentDTO> list =
        jdbcTemplate.query(
            "SELECT id, post_id, body, author_user_one_id, parent_comment_id, created_at "
                + "FROM chek_content_comment WHERE id = ?",
            (rs, rowNum) -> {
              CommentDTO dto = new CommentDTO();
              dto.setCommentId(rs.getLong("id"));
              dto.setPostId(rs.getLong("post_id"));
              dto.setBody(rs.getString("body"));
              dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
              long parentId = rs.getLong("parent_comment_id");
              dto.setParentCommentId(rs.wasNull() ? null : parentId);
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              return dto;
            },
            id);
    return list.isEmpty() ? null : list.get(0);
  }

  public List<PostDTO> listPublicForSsg(Instant updatedAfter, Long cursor, int limit) {
    int n = Math.max(1, Math.min(limit, 200));
    long cur = cursor == null ? 0L : cursor;
    List<Object> args = new ArrayList<>();

    StringBuilder sql =
        new StringBuilder(
            "SELECT p.id, p.title, p.body_md, p.location_name, p.lng, p.lat, p.occurred_at, "
                + "p.author_user_one_id, p.is_public, p.is_indexable, p.created_at, p.updated_at, "
                + "(SELECT COUNT(1) FROM chek_content_comment c WHERE c.post_id = p.id) AS comment_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_like l WHERE l.post_id = p.id) AS like_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_favorite f WHERE f.post_id = p.id) AS favorite_count "
                + "FROM chek_content_post p WHERE p.is_public = TRUE AND p.is_indexable = TRUE ");

    if (updatedAfter != null) {
      sql.append("AND p.updated_at > ? ");
      args.add(Timestamp.from(updatedAfter));
    }
    if (cur > 0) {
      sql.append("AND p.id < ? ");
      args.add(cur);
    }

    sql.append("ORDER BY p.id DESC LIMIT ? ");
    args.add(n);

    List<PostDTO> list =
        jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> {
              PostDTO dto = new PostDTO();
              dto.setPostId(rs.getLong("id"));
              dto.setTitle(rs.getString("title"));
              dto.setBody(rs.getString("body_md"));
              dto.setLocationName(rs.getString("location_name"));
              dto.setLng(toNullableDouble(rs.getBigDecimal("lng")));
              dto.setLat(toNullableDouble(rs.getBigDecimal("lat")));
              Timestamp occurredAt = rs.getTimestamp("occurred_at");
              dto.setOccurredAt(occurredAt == null ? null : occurredAt.toInstant());
              dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              dto.setCommentCount(rs.getLong("comment_count"));
              dto.setLikeCount(rs.getLong("like_count"));
              dto.setFavoriteCount(rs.getLong("favorite_count"));
              dto.setLikedByMe(false);
              dto.setFavoritedByMe(false);
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    for (PostDTO dto : list) {
      dto.setTags(listTagNamesByPostId(dto.getPostId()));
      dto.setMedia(listMediaByPostId(dto.getPostId()));
    }
    return list;
  }

  public List<PostDTO> listFavorites(String userOneId, Long cursor, int limit) {
    String viewer = userOneId == null ? "" : userOneId.trim();
    if (viewer.isBlank()) return Collections.emptyList();

    int n = Math.max(1, Math.min(limit, 100));
    long cur = cursor == null ? 0L : cursor;
    List<Object> args = new ArrayList<>();

    StringBuilder sql =
        new StringBuilder(
            "SELECT p.id, p.title, p.body_md, p.location_name, p.lng, p.lat, p.occurred_at, "
                + "p.author_user_one_id, p.is_public, p.is_indexable, p.created_at, p.updated_at, "
                + "(SELECT COUNT(1) FROM chek_content_comment c WHERE c.post_id = p.id) AS comment_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_like l WHERE l.post_id = p.id) AS like_count, "
                + "(SELECT COUNT(1) FROM chek_content_post_favorite f WHERE f.post_id = p.id) AS favorite_count, "
                + "EXISTS(SELECT 1 FROM chek_content_post_like l2 WHERE l2.post_id = p.id AND l2.user_one_id = ?) AS liked_by_me, "
                + "TRUE AS favorited_by_me "
                + "FROM chek_content_post_favorite fav "
                + "JOIN chek_content_post p ON p.id = fav.post_id "
                + "WHERE fav.user_one_id = ? AND p.is_public = TRUE AND p.is_indexable = TRUE ");

    args.add(viewer);
    args.add(viewer);

    if (cur > 0) {
      sql.append("AND p.id < ? ");
      args.add(cur);
    }

    sql.append("ORDER BY p.id DESC LIMIT ? ");
    args.add(n);

    List<PostDTO> list =
        jdbcTemplate.query(
            sql.toString(),
            (rs, rowNum) -> {
              PostDTO dto = new PostDTO();
              dto.setPostId(rs.getLong("id"));
              dto.setTitle(rs.getString("title"));
              dto.setBody(rs.getString("body_md"));
              dto.setLocationName(rs.getString("location_name"));
              dto.setLng(toNullableDouble(rs.getBigDecimal("lng")));
              dto.setLat(toNullableDouble(rs.getBigDecimal("lat")));
              Timestamp occurredAt = rs.getTimestamp("occurred_at");
              dto.setOccurredAt(occurredAt == null ? null : occurredAt.toInstant());
              dto.setAuthorUserOneId(rs.getString("author_user_one_id"));
              dto.setPublic(rs.getBoolean("is_public"));
              dto.setIndexable(rs.getBoolean("is_indexable"));
              dto.setCommentCount(rs.getLong("comment_count"));
              dto.setLikeCount(rs.getLong("like_count"));
              dto.setFavoriteCount(rs.getLong("favorite_count"));
              dto.setLikedByMe(rs.getBoolean("liked_by_me"));
              dto.setFavoritedByMe(rs.getBoolean("favorited_by_me"));
              Timestamp createdAt = rs.getTimestamp("created_at");
              dto.setCreatedAt(createdAt == null ? null : createdAt.toInstant());
              Timestamp updatedAt = rs.getTimestamp("updated_at");
              dto.setUpdatedAt(updatedAt == null ? null : updatedAt.toInstant());
              return dto;
            },
            args.toArray());

    for (PostDTO dto : list) {
      dto.setTags(listTagNamesByPostId(dto.getPostId()));
      dto.setMedia(listMediaByPostId(dto.getPostId()));
    }
    return list;
  }

  private void upsertPostTags(long postId, List<String> tags) {
    List<String> tagNames = normalizeTags(tags);
    if (tagNames.isEmpty()) return;

    for (String name : tagNames) {
      Long tagId = findOrCreateTagId(name);
      if (tagId == null) continue;
      jdbcTemplate.update(
          "INSERT INTO chek_content_post_tag(post_id, tag_id) VALUES(?, ?)", postId, tagId);
    }
  }

  private void upsertPostMedia(long postId, List<CreatePostMediaItem> media) {
    if (media == null || media.isEmpty()) return;
    for (CreatePostMediaItem item : media) {
      if (item == null) continue;
      Long mediaObjectId = item.getMediaObjectId();
      if (mediaObjectId == null || mediaObjectId <= 0) continue;
      String kind = item.getKind();
      if (kind == null || kind.isBlank()) kind = "IMAGE";
      try {
        jdbcTemplate.update(
            "INSERT INTO chek_content_post_media(post_id, media_object_id, kind) VALUES(?, ?, ?)",
            postId,
            mediaObjectId,
            kind.trim().toUpperCase());
      } catch (DataIntegrityViolationException ignored) {
        // ignore duplicate
      }
    }
  }

  private List<String> listTagNamesByPostId(long postId) {
    return jdbcTemplate.query(
        "SELECT t.name FROM chek_content_tag t "
            + "JOIN chek_content_post_tag pt ON t.id = pt.tag_id "
            + "WHERE pt.post_id = ? ORDER BY t.id ASC",
        (rs, rowNum) -> rs.getString("name"),
        postId);
  }

  private List<PostMediaDTO> listMediaByPostId(long postId) {
    return jdbcTemplate.query(
        "SELECT media_object_id, kind FROM chek_content_post_media "
            + "WHERE post_id = ? ORDER BY media_object_id ASC",
        (rs, rowNum) -> {
          PostMediaDTO dto = new PostMediaDTO();
          dto.setMediaObjectId(rs.getLong("media_object_id"));
          dto.setKind(rs.getString("kind"));
          return dto;
        },
        postId);
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

  private static Double toNullableDouble(BigDecimal v) {
    return v == null ? null : v.doubleValue();
  }
}
