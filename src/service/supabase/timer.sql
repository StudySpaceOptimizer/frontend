-- 創建日誌表，用於記錄 CRON 任務執行的日誌
CREATE TABLE IF NOT EXISTS cronlog (
    log_time TIMESTAMP WITH TIME ZONE, -- 日誌記錄時間
    log_msg TEXT                       -- 日誌訊息
);

/* ==========================
 * RLS
 * ==========================
 */

-- 啟用 RLS
ALTER TABLE cronlog ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON cronlog;

CREATE POLICY admin_all_access ON cronlog AS PERMISSIVE FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

/* ==========================
 * TIMMER FUNCTION
 * ==========================
 */

-- 創建函數，用於檢查預約時間違規
CREATE OR REPLACE FUNCTION process_reservation_time_violations () RETURNS VOID AS $$
DECLARE
    checkin_deadline INTERVAL;
    leave_deadline INTERVAL;
    violation_points INTEGER;
    rec RECORD;
BEGIN
    -- 從設定表中獲取 checkin 的時間限制
    SELECT (value::numeric * interval '1 minute') INTO checkin_deadline
    FROM settings WHERE key_name = 'checkin_deadline_minutes';
    
    -- 從設定表中獲取臨時離開的時間限制
    SELECT (value::numeric * interval '1 minute') INTO leave_deadline
    FROM settings WHERE key_name = 'temporary_leave_deadline_minutes';

    -- 從設定表中獲取違反檢查點數
    SELECT value::integer INTO violation_points
    FROM settings WHERE key_name = 'check_in_violation_points';
    
    -- 循環檢查所有活躍的預約
    FOR rec IN SELECT * FROM active_reservations LOOP
        /*
            每分鐘檢查流程：

            1. 檢查是否未 check in (check_in is NULL)
                1.1. 是，判斷是否 is_in
                    1.1.1. 是，表示使用者是續約
                        - 設定 check_in = begin_time
                    1.1.2. 否，判斷是否超過 check in 時間
                        - 如果超過 check in 時間，刪除該預約

            2. 檢查是否離開 (temporary_leave_time is not NULL)
                2.1. 否，判斷是否 is_in
                    2.1.1. 是，表示使用者在館內，正常情況
                    2.1.2. 否，表示使用者是續約，且在上一個預約離開
                        - 設定 temporary_leave_time = begin_time
                2.2. 是，判斷是否離開時間過久
                    - 如果離開時間過久，終止預約
                        - 將 end_time 設置為現在的時間
        */

        -- 判斷是否未 check in
        IF rec.check_in_time IS NULL THEN
            -- 使用者在館內
            IF rec.is_in THEN
                -- 使用者是續約，將 check_in_time 設置為 begin_time
                UPDATE reservations SET check_in_time = rec.begin_time WHERE id = rec.id;

            -- 使用者不在館內，判斷是否超過 check in 時間
            ELSIF now() - rec.begin_time > checkin_deadline THEN
                -- 刪除違反 checkin 截止時間的預約
                DELETE FROM reservations WHERE id = rec.id;
                UPDATE user_profiles SET point = point + violation_points WHERE id = rec.user_id;

                -- 寫入日誌到 cronlog
                INSERT INTO cronlog (log_time, log_msg) VALUES (NOW(), 'Check-in deadline violation for reservation ' || rec.id);
            END IF;            
        END IF;

        -- 判斷是否離開
        IF rec.temporary_leave_time IS NOT NULL THEN
            -- 是，判斷是否離開時間過久
            IF now() - rec.temporary_leave_time > leave_deadline THEN
                -- 將 end_time 設置為現在的時間
                UPDATE reservations SET end_time = NOW() WHERE id = rec.id;

                -- 寫入日誌到 cronlog
                INSERT INTO cronlog (log_time, log_msg) VALUES (NOW(), 'Temporary leave deadline violation for reservation ' || rec.id);
            END IF;
        
        -- 使用者未離開，判斷是否不在館內
        ELSIF NOT rec.is_in THEN
                -- 使用者是續約且在上一個預約已離開，設定 temporary_leave_time 為 begin_time
                UPDATE reservations SET temporary_leave_time = rec.begin_time WHERE id = rec.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安排一個 CRON 任務，每分鐘檢查一次預約時間違規
SELECT cron.schedule (
    '預約檢查',
    '* * * * *',
    $$CALL process_reservation_time_violations()$$
);