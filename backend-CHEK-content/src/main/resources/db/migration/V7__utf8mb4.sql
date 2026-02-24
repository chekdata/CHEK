-- CHEK Content Service: ensure emoji-safe utf8mb4 for text columns

ALTER TABLE chek_content_tag CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chek_content_wiki_entry CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chek_content_post CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chek_content_comment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

