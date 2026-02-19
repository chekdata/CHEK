-- Local dev MySQL init for CHEK (prod-like storage)
-- Creates per-service databases and a low-privilege user.

CREATE DATABASE IF NOT EXISTS chek_content
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS chek_media
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS chek_ai
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'chek'@'%' IDENTIFIED BY 'chek';

GRANT ALL PRIVILEGES ON chek_content.* TO 'chek'@'%';
GRANT ALL PRIVILEGES ON chek_media.* TO 'chek'@'%';
GRANT ALL PRIVILEGES ON chek_ai.* TO 'chek'@'%';

FLUSH PRIVILEGES;

