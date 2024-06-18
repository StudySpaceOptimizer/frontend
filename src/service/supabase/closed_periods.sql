-- 創建額外關閉時段表
CREATE TABLE IF NOT EXISTS closed_periods (
    id serial PRIMARY KEY,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL
);

-- 創建結束時間索引
CREATE INDEX IF NOT EXISTS idx_closed_periods_end_time ON closed_periods (end_time);

-- 創建視圖以篩選當前有效的關閉時段
CREATE OR REPLACE VIEW active_closed_periods
WITH (security_invoker = on) AS
SELECT *
FROM public.closed_periods
WHERE end_time > NOW();


/* ==========================
 * RLS
 * ==========================
 */
 
-- 啟用 RLS
ALTER TABLE closed_periods ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON closed_periods;
CREATE POLICY admin_all_access ON closed_periods
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 普通使用者僅允許查詢
DROP POLICY IF EXISTS user_read_only ON closed_periods;
CREATE POLICY user_read_only ON closed_periods
AS PERMISSIVE
FOR SELECT
USING (true);