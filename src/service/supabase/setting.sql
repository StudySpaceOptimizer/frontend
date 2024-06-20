-- 創建設定表
CREATE TABLE IF NOT EXISTS
    settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        key_name VARCHAR(255) UNIQUE NOT NULL, -- 設定名稱
        value TEXT NOT NULL, -- 設定值
        description TEXT -- 設定描述
    );

/* ==========================
 * RLS
 * ==========================
 */
-- 啟用 RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 允許管理員查詢和修改
DROP POLICY IF EXISTS admin_select ON settings;

CREATE POLICY admin_select ON settings AS PERMISSIVE FOR
SELECT
    USING (is_claims_admin ());

DROP POLICY IF EXISTS admin_update ON settings;

CREATE POLICY admin_update ON settings AS PERMISSIVE FOR
UPDATE USING (is_claims_admin ())
WITH
    CHECK (is_claims_admin ());

-- 普通使用者僅允許查詢
DROP POLICY IF EXISTS user_read_only ON settings;

CREATE POLICY user_read_only ON settings AS PERMISSIVE FOR
SELECT
    USING (true);

/* ==========================
 * 新增 default
 * ==========================
 */
INSERT INTO
    settings (key_name, value, description)
VALUES
    (
        'weekday_opening_hours',
        '{"begin_time": "08:00", "end_time": "22:00"}',
        '工作日開放時間'
    ),
    (
        'weekend_opening_hours',
        '{"begin_time": "09:00", "end_time": "17:00"}',
        '週末開放時間'
    ),
    (
        'maximum_reservation_duration',
        '6',
        '單次預約時間上限(小時)'
    ),
    ('student_reservation_limit', '14', '學生提前預約期限(天)'),
    (
        'outsider_reservation_limit',
        '-1',
        '校外人士提前預約期限(天)'
    ),
    ('points_to_ban_user', '7', '達到一定的點數就自動封禁使用者'),
    (
        'checkin_deadline_minutes',
        '15',
        'checkin 時間(分鐘)'
    ),
    (
        'temporary_leave_deadline_minutes',
        '60',
        '暫時中離時間(分鐘)'
    ),
    (
        'check_in_violation_points',
        '1',
        '違反 checkin 截止時間時增加的點數'
    ),
    ('reservation_time_unit', '30', '最小預約的單位(分鐘)') ON CONFLICT (key_name)
DO
UPDATE
SET
    value = EXCLUDED.value,
    description = EXCLUDED.description;