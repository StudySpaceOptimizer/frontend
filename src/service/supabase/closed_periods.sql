-- 創建一個表來存儲額外關閉時段
CREATE TABLE IF NOT EXISTS closed_periods (
    id SERIAL PRIMARY KEY,
    begin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 為結束時間創建索引，優化查詢性能
CREATE INDEX IF NOT EXISTS idx_closed_periods_end_time ON closed_periods (end_time);

-- 創建視圖，篩選當前有效的關閉時段
CREATE OR REPLACE VIEW active_closed_periods
WITH (security_invoker = on) AS
SELECT *
FROM public.closed_periods
WHERE end_time > NOW();

-- ==========================
-- RLS
-- ==========================

-- 啟用RLS
ALTER TABLE closed_periods ENABLE ROW LEVEL SECURITY;

-- 為管理員創建全權訪問策略
DROP POLICY IF EXISTS admin_all_access ON closed_periods;
CREATE POLICY admin_all_access ON closed_periods AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 為普通使用者創建僅讀取權限的策略
DROP POLICY IF EXISTS user_read_only ON closed_periods;
CREATE POLICY user_read_only ON closed_periods AS PERMISSIVE
FOR SELECT
USING (TRUE);
