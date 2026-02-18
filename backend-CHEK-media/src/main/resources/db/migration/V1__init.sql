-- CHEK Media Service tables (isolated from existing data)
-- Naming convention: chek_media_*

CREATE TABLE IF NOT EXISTS chek_media_object (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  bucket VARCHAR(128) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT,
  uploader_user_one_id VARCHAR(64),
  status VARCHAR(16) NOT NULL DEFAULT 'PRESIGNED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chek_media_object_key (bucket, object_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

