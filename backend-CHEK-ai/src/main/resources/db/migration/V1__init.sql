-- CHEK AI Service tables (isolated from existing data)
-- Naming convention: chek_ai_*

CREATE TABLE IF NOT EXISTS chek_ai_session (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_one_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chek_ai_session_user (user_one_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chek_ai_message (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  role VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_chek_ai_message_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chek_ai_rating (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chek_ai_rating_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

