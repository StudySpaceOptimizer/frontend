-- 創建座位表，用於存儲座位的相關信息
CREATE TABLE IF NOT EXISTS seats (
    id INT8 PRIMARY KEY,       -- 座位的唯一標識
    available BOOLEAN NOT NULL, -- 座位是否可用
    other_info TEXT             -- 座位的其他信息
);

-- ==========================
-- RLS
-- ==========================

-- 啟用RLS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 允許管理員查詢座位表
DROP POLICY IF EXISTS admin_select ON seats;

CREATE POLICY admin_select ON seats AS PERMISSIVE FOR
SELECT
    USING (is_claims_admin());

-- 允許管理員修改座位表
DROP POLICY IF EXISTS admin_update ON seats;

CREATE POLICY admin_update ON seats AS PERMISSIVE FOR
UPDATE USING (is_claims_admin())
WITH
    CHECK (is_claims_admin());

-- 允許所有使用者查詢座位表
DROP POLICY IF EXISTS user_select ON seats;

CREATE POLICY user_select ON seats AS PERMISSIVE FOR
SELECT
    USING (true);
