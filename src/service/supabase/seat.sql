-- 創建座位表
CREATE TABLE IF NOT EXISTS seats (
    id int8 PRIMARY KEY,
    available boolean NOT NULL,
    other_info text
);

-- 啟用 RLS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 允許管理員查詢和修改
DROP POLICY IF EXISTS admin_select ON seats;
CREATE POLICY admin_select ON seats
AS PERMISSIVE
FOR SELECT
USING (is_claims_admin());

DROP POLICY IF EXISTS admin_update ON seats;
CREATE POLICY admin_update ON seats
AS PERMISSIVE
FOR UPDATE
USING (is_claims_admin())
WITH CHECK (is_claims_admin());


-- 允許使用者查詢
DROP POLICY IF EXISTS user_select ON seats;
CREATE POLICY user_select ON seats
AS PERMISSIVE
FOR SELECT
USING (true);
