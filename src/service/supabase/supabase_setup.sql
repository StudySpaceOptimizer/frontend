-- 設置資料庫時區為亞洲台北
ALTER DATABASE postgres
SET timezone TO 'Asia/Taipei';

-- 創建 pg_cron 擴展
CREATE EXTENSION IF NOT EXISTS pg_cron;