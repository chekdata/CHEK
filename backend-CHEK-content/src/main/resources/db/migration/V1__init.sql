-- CHEK Content Service tables (isolated from existing data)
-- Naming convention: chek_content_*

CREATE TABLE IF NOT EXISTS chek_content_tag (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS chek_content_wiki_entry (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  entry_type VARCHAR(32) NOT NULL,
  summary VARCHAR(500),
  content_struct_json TEXT,
  lng DECIMAL(10,6),
  lat DECIMAL(10,6),
  start_at TIMESTAMP NULL,
  end_at TIMESTAMP NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (title)
);

CREATE TABLE IF NOT EXISTS chek_content_wiki_entry_version (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  entry_id BIGINT NOT NULL,
  version_num INT NOT NULL,
  summary VARCHAR(500),
  content_struct_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_user_one_id VARCHAR(64),
  UNIQUE (entry_id, version_num)
);

CREATE TABLE IF NOT EXISTS chek_content_wiki_entry_tag (
  entry_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS chek_content_post (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
  title VARCHAR(120),
  body TEXT,
  ext_json TEXT,
  occurred_at TIMESTAMP NULL,
  lng DECIMAL(10,6),
  lat DECIMAL(10,6),
  author_user_one_id VARCHAR(64) NOT NULL,
  linked_wiki_entry_ids_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chek_content_post_tag (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS chek_content_post_media (
  post_id BIGINT NOT NULL,
  media_object_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, media_object_id)
);

CREATE TABLE IF NOT EXISTS chek_content_post_action_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  post_id BIGINT NOT NULL,
  action_type VARCHAR(32) NOT NULL,
  actor_user_one_id VARCHAR(64),
  payload_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chek_content_volunteer_profile (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_one_id VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  real_name_enc VARBINARY(512),
  id_no_enc VARBINARY(512),
  phone_enc VARBINARY(512),
  reviewed_by_user_one_id VARCHAR(64),
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_one_id)
);

CREATE TABLE IF NOT EXISTS chek_content_no_show_counter (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  subject_user_one_id VARCHAR(64) NOT NULL,
  subject_role VARCHAR(16) NOT NULL,
  window_start DATE NOT NULL,
  window_days INT NOT NULL DEFAULT 7,
  cnt INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (subject_user_one_id, subject_role, window_start)
);

CREATE TABLE IF NOT EXISTS chek_content_moderation_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_type VARCHAR(32) NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chek_content_moderation_action (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  action_type VARCHAR(32) NOT NULL,
  comment VARCHAR(500),
  actor_user_one_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chek_content_price_ref (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(16) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  unit VARCHAR(32),
  currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
  location_json TEXT,
  time_range_json TEXT,
  source_type VARCHAR(32) NOT NULL,
  source_id BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
