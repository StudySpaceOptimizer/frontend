ALTER database postgres
SET
    timezone TO 'Asia/Taipei';

CREATE EXTENSION IF NOT EXISTS pg_cron;