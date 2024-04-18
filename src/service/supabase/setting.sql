-- 創建設定表
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name VARCHAR(255) UNIQUE NOT NULL,  -- 設定名稱
    value TEXT NOT NULL,  -- 設定值
    description TEXT  -- 設定描述
);

-- 啟用 RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;


-- 允許管理員查詢和修改
DROP POLICY IF EXISTS admin_select ON settings;
CREATE POLICY admin_select ON settings
AS PERMISSIVE
FOR SELECT
USING (is_claims_admin());

DROP POLICY IF EXISTS admin_update ON settings;
CREATE POLICY admin_update ON settings
AS PERMISSIVE
FOR UPDATE
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 普通使用者僅允許查詢
DROP POLICY IF EXISTS user_read_only ON settings;
CREATE POLICY user_read_only ON settings
AS PERMISSIVE
FOR SELECT
USING (true);

INSERT INTO settings (key_name, value, description)
VALUES
    ('weekday_opening_hours', '{"begin_time": "08:00", "end_time": "22:00"}', '工作日開放時間'),
    ('weekend_opening_hours', '{"begin_time": "09:00", "end_time": "17:00"}', '週末開放時間'),
    ('minimum_reservatio_duration', '1', '最小預約時間單位為小時'),
    ('maximum_reservation_duration', '6', '單次預約時間上限為小時'),
    ('student_reservation_limit', '7', '學生提前預約期限為天'),
    ('outsider_reservation_limit', '0', '校外人士提前預約期限為天'),
    ('points_to_ban_user', '7', '達到一定的點數就自動封禁使用者')
ON CONFLICT (key_name) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;

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