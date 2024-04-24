CREATE TABLE cronlog (
    log_time timestamp with time zone,
    log_msg TEXT
);

-- 啟用 RLS
ALTER TABLE cronlog ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON cronlog;
CREATE POLICY admin_all_access ON cronlog
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 檢查是否有位 check in 的預約
CREATE OR REPLACE FUNCTION process_reservation_time_violations()
RETURNS VOID AS $$
DECLARE
    checkin_deadline INTERVAL;
    leave_deadline INTERVAL;
    violation_points INTEGER;
    rec RECORD;
BEGIN
    -- 從設定表中獲取時間上限
    SELECT (value::numeric * interval '1 minute') INTO checkin_deadline
    FROM settings WHERE key_name = 'checkin_deadline_minutes';
    
    SELECT (value::numeric * interval '1 minute') INTO leave_deadline
    FROM settings WHERE key_name = 'temporary_leave_deadline_minutes';

    -- 從設定表中獲取違規時增加的點數
    SELECT value::integer INTO violation_points
    FROM settings WHERE key_name = 'check_in_violation_points';
    
    FOR rec IN SELECT * FROM active_reservations LOOP
        -- 判斷是否違反了checkin截止時間
        IF rec.check_in_time IS NULL AND now() - rec.begin_time > checkin_deadline THEN
            -- 刪除違反checkin截止時間的預約
            DELETE FROM reservations WHERE id = rec.id;
            UPDATE user_profiles SET point = point + violation_points WHERE id = rec.user_id;

            -- 寫入日誌到cronlog
            INSERT INTO cronlog (log_time, log_msg) VALUES (NOW(), 'Check-in deadline violation for reservation ' || rec.id);

        ELSIF rec.temporary_leave_time IS NOT NULL AND now() - rec.temporary_leave_time > leave_deadline THEN
            -- 將end_time設置為現在的時間
            UPDATE reservations SET end_time = NOW() WHERE id = rec.id;

            -- 寫入日誌到cronlog
            INSERT INTO cronlog (log_time, log_msg) VALUES (NOW(), 'Temporary leave deadline violation for reservation ' || rec.id);
        END IF;
    END LOOP;
END;
$$ 
LANGUAGE plpgsql
SECURITY DEFINER;


SELECT cron.schedule('預約檢查', '* * * * *', $$CALL process_reservation_time_violations()$$);
