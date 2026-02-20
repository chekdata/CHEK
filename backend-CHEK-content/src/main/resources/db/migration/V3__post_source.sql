-- CHEK Content Service: external post sources (Weibo/XHS etc)

ALTER TABLE chek_content_post ADD COLUMN source_platform VARCHAR(32) NULL;
ALTER TABLE chek_content_post ADD COLUMN source_id VARCHAR(128) NULL;
ALTER TABLE chek_content_post ADD COLUMN source_url VARCHAR(500) NULL;

CREATE UNIQUE INDEX ux_post_source ON chek_content_post(source_platform, source_id);
CREATE INDEX idx_post_source_platform ON chek_content_post(source_platform, id);

