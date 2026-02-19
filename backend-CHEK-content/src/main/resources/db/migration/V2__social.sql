-- CHEK Content Service social interactions (MVP)
-- Likes / Favorites / Follows

CREATE TABLE IF NOT EXISTS chek_content_post_like (
  post_id BIGINT NOT NULL,
  user_one_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_one_id),
  INDEX idx_like_user (user_one_id, created_at),
  INDEX idx_like_post (post_id, created_at)
);

CREATE TABLE IF NOT EXISTS chek_content_post_favorite (
  post_id BIGINT NOT NULL,
  user_one_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_one_id),
  INDEX idx_favorite_user (user_one_id, created_at),
  INDEX idx_favorite_post (post_id, created_at)
);

CREATE TABLE IF NOT EXISTS chek_content_user_follow (
  follower_user_one_id VARCHAR(64) NOT NULL,
  followee_user_one_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_user_one_id, followee_user_one_id),
  INDEX idx_follow_followee (followee_user_one_id, created_at),
  INDEX idx_follow_follower (follower_user_one_id, created_at)
);

