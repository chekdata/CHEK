-- CHEK Content Service: crawler query bandit stats (AI-driven scheduling)

CREATE TABLE IF NOT EXISTS chek_content_crawler_query_stat (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  platform VARCHAR(32) NOT NULL,
  query_text VARCHAR(200) NOT NULL,
  alpha DOUBLE NOT NULL DEFAULT 1.0,
  beta DOUBLE NOT NULL DEFAULT 1.0,
  last_reward DOUBLE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (platform, query_text),
  INDEX idx_crawler_query_platform (platform, updated_at)
);

