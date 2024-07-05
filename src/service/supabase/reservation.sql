-- 創建預約表，如果不存在
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    begin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL,
    seat_id INT8 NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    temporary_leave_time TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_seat FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE CASCADE
);

-- 為預約紀錄的結束時間創建索引，以提高查詢效率
CREATE INDEX IF NOT EXISTS idx_reservations_end_time ON reservations (end_time);

-- 創建視圖以篩選當前有效的預約記錄
CREATE OR REPLACE VIEW active_reservations
WITH (security_invoker = ON) AS
SELECT *
FROM public.reservations
WHERE end_time > NOW();

-- ==========================
-- RLS
-- ==========================

-- 啟用RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 為管理員角色創建全權訪問策略
DROP POLICY IF EXISTS admin_all_access ON reservations;
CREATE POLICY admin_all_access ON reservations AS PERMISSIVE FOR ALL USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 為普通使用者創建查詢自己的預約資料的策略
DROP POLICY IF EXISTS user_select_own ON reservations;
CREATE POLICY user_select_own ON reservations AS PERMISSIVE FOR SELECT
USING (auth.uid() = user_id);

-- 為普通使用者創建新增自己的預約的策略
DROP POLICY IF EXISTS user_insert_own ON reservations;
CREATE POLICY user_insert_own ON reservations AS PERMISSIVE FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_not_banned());

-- 為普通使用者創建刪除自己的預約的策略
DROP POLICY IF EXISTS user_delete_own ON reservations;
CREATE POLICY user_delete_own ON reservations AS PERMISSIVE FOR DELETE USING (auth.uid() = user_id);

-- 為普通使用者創建更新自己的預約的策略
DROP POLICY IF EXISTS user_update_own ON reservations;
CREATE POLICY user_update_own ON reservations AS PERMISSIVE FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

/* ==========================
 * CLS
 * ==========================
 */

-- 限制非管理員的更新範圍，確保僅允許更新 end_time 欄位
CREATE OR REPLACE FUNCTION cls_reservations_update() RETURNS TRIGGER AS $$
BEGIN
    IF session_user = 'authenticator' THEN
        RETURN NEW;
    END IF;

    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    IF NEW.id != OLD.id OR
       NEW.begin_time != OLD.begin_time OR
       NEW.user_id != OLD.user_id OR
       NEW.seat_id != OLD.seat_id OR
       NEW.check_in_time != OLD.check_in_time THEN
        RAISE EXCEPTION '{"code": "U0001"}';
    END IF;

    IF auth.uid() != OLD.user_id THEN
        RAISE EXCEPTION '{"code": "U0001"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 在更新前檢查用戶個人資料更新條件
DROP TRIGGER IF EXISTS trigger_cls_reservations_update ON reservations;
CREATE TRIGGER trigger_cls_reservations_update BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION cls_reservations_update();

/* ==========================
 * 檢查預約限制
 * ==========================
 */
 
-- 確認提早離開是否合法
CREATE OR REPLACE FUNCTION check_early_termination_validity() RETURNS TRIGGER AS $$
BEGIN
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    IF NEW.check_in_time IS NULL THEN
        RAISE EXCEPTION '{"code": "R0001"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 在提早結束前檢查是否已經報到
DROP TRIGGER IF EXISTS trigger_check_early_termination_validity ON reservations;
CREATE TRIGGER trigger_check_early_termination_validity BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_early_termination_validity();

-- 檢查預約的合法性
CREATE OR REPLACE FUNCTION check_reservation_validity() RETURNS TRIGGER AS $$
BEGIN
    -- 如果是使用 Supabase UI 或 service_key，則不受限制
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    -- 檢查預約的開始時間和結束時間是否在同一天
    IF DATE(NEW.begin_time) != DATE(NEW.end_time) THEN 
        RAISE EXCEPTION '{"code": "R0002"}';
    END IF;

    -- 檢查預約的結束時間是否晚於開始時間
    IF NEW.end_time <= NEW.begin_time THEN
        RAISE EXCEPTION '{"code": "R0003"}';
    END IF;

    -- 如果是新增操作，進一步檢查預約開始時間必須大於當前時間
    IF TG_OP = 'INSERT' AND NEW.begin_time <= current_timestamp THEN
        RAISE EXCEPTION '{"code": "R0004"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 在新增或修改預約之前檢查預約的合法性
DROP TRIGGER IF EXISTS trigger_check_reservation_validity ON reservations;
CREATE TRIGGER trigger_check_reservation_validity
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_validity();

-- 檢查所選座位的可用性以及預約時間是否與現有預約時間重疊
CREATE OR REPLACE FUNCTION check_seat_availability_and_reservation_conflict() RETURNS TRIGGER AS $$
BEGIN
    -- 如果是使用 Supabase UI 或 service_key，則不受限制
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    -- 檢查選定座位是否可用
    IF NOT (SELECT available FROM seats WHERE id = NEW.seat_id) THEN
        RAISE EXCEPTION '{"code": "R0005"}';
    END IF;

    -- 檢查預約時間是否與同一座位的其他預約重疊
    IF EXISTS (
        SELECT 1 FROM active_seat_reservations
        WHERE seat_id = NEW.seat_id
        AND reservation_id <> NEW.id -- 確保不檢查當前行
        AND (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN
        RAISE EXCEPTION '{"code": "R0006"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 在新增或修改之前檢查座位可用性和預約時間重疊
DROP TRIGGER IF EXISTS trigger_check_seat_availability_and_reservation_conflict ON reservations;
CREATE TRIGGER trigger_check_seat_availability_and_reservation_conflict
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_seat_availability_and_reservation_conflict();

-- 檢查預約設定限制
CREATE OR REPLACE FUNCTION check_reservation_limits() RETURNS TRIGGER AS $$
DECLARE
    weekday_opening TIME;
    weekday_closing TIME;
    weekend_opening TIME;
    weekend_closing TIME;
    maximum_duration INT;
    student_limit INT;
    outsider_limit INT;
    reservation_duration INT;
    reservation_time_unit INT;
    user_role TEXT;

BEGIN
    -- 如果是使用 Supabase UI 或 service_key，則不受限制
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    -- 從設定中提取時間和限制
    SELECT (VALUE::jsonb)->>'begin_time', (VALUE::jsonb)->>'end_time' INTO weekday_opening, weekday_closing
    FROM settings WHERE key_name = 'weekday_opening_hours';

    SELECT (VALUE::jsonb)->>'begin_time', (VALUE::jsonb)->>'end_time' INTO weekend_opening, weekend_closing
    FROM settings WHERE key_name = 'weekend_opening_hours';

    SELECT VALUE::numeric INTO maximum_duration FROM settings WHERE key_name = 'maximum_reservation_duration';
    SELECT VALUE::int INTO student_limit FROM settings WHERE key_name = 'student_reservation_limit';
    SELECT VALUE::int INTO outsider_limit FROM settings WHERE key_name = 'outsider_reservation_limit';
    SELECT VALUE::int INTO reservation_time_unit FROM settings WHERE key_name = 'reservation_time_unit';

    -- 計算預約時長
    reservation_duration := EXTRACT(EPOCH FROM (NEW.end_time - NEW.begin_time)) / 3600;

    -- 判斷是否為工作日或周末，並檢查開放時間
    IF EXTRACT(ISODOW FROM NEW.begin_time) BETWEEN 1 AND 5 THEN -- 工作日
        IF NEW.begin_time::TIME < weekday_opening OR NEW.end_time::TIME > weekday_closing THEN
            RAISE EXCEPTION '{"code": "RS0001"}';
        END IF;
    ELSE -- 周末
        IF NEW.begin_time::TIME < weekend_opening OR NEW.end_time::TIME > weekend_closing THEN
            RAISE EXCEPTION '{"code": "RS0002"}';
        END IF;
    END IF;

    -- 檢查預約時長是否合法
    IF TG_OP = 'INSERT' THEN -- 開始、結束能被整除
        IF (EXTRACT(EPOCH FROM NEW.begin_time) / 60) % reservation_time_unit != 0 OR
           (EXTRACT(EPOCH FROM NEW.end_time) / 60) % reservation_time_unit != 0 THEN
           
            RAISE EXCEPTION '{"code": "RS0003", "data": ["%"]}', reservation_time_unit;
        END IF;

        IF reservation_duration > maximum_duration THEN
            RAISE EXCEPTION '{"code":"RS0004", "data": ["%"]}', maximum_duration;
        END IF;
    END IF;

    SELECT trim(BOTH '"' FROM (get_my_claims() ->> 'user_role')) INTO user_role;

    -- 若不是管理員
    IF NOT is_claims_admin() THEN -- 檢查學生預約是否在可提前預約的日期內
        IF user_role = 'student' AND ((NEW.begin_time::DATE - CURRENT_DATE) > student_limit) THEN
            RAISE EXCEPTION '{"code":"RS0005", "data": ["%"]}', student_limit;
        END IF;

        -- 檢查校外人士預約是否在可提前預約的日期內
        IF user_role = 'outsider' AND ((NEW.begin_time::DATE - CURRENT_DATE) > outsider_limit) THEN
            RAISE EXCEPTION '{"code":"RS0006", "data": ["%"]}', outsider_limit;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 在新增或修改之前檢查預約設定限制
DROP TRIGGER IF EXISTS trigger_check_reservation_limits ON reservations;
CREATE TRIGGER trigger_check_reservation_limits
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_limits();
-- 檢查新的預約時間是否與任何已存在的關閉時段重疊，確保預約在開放時間內
CREATE OR REPLACE FUNCTION check_reservation_overlap_with_closed_periods() RETURNS TRIGGER AS $$
BEGIN
    -- 使用 Supabase UI 或 service_key 不受限制
    IF is_supabase_ui_or_service_key() THEN 
        RETURN NEW;
    END IF;

    -- 如果預約時間與任何已存在的關閉時段重疊，則拋出異常
    IF EXISTS (
        SELECT 1
        FROM active_closed_periods
        WHERE (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN 
        RAISE EXCEPTION '{"code":"RS0007"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在新增或修改預約前檢查是否與關閉時段重疊
DROP TRIGGER IF EXISTS trigger_check_reservation_overlap_with_closed_periods ON reservations;
CREATE TRIGGER trigger_check_reservation_overlap_with_closed_periods
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap_with_closed_periods();

-- 檢查用戶當天是否有未完成的預約
CREATE OR REPLACE FUNCTION check_unfinished_reservation() RETURNS TRIGGER AS $$
DECLARE
    end_of_day TIMESTAMP WITH TIME ZONE;
    next_time_unit TIMESTAMP WITH TIME ZONE;
    reservation_time_unit INT;
    total_minutes INT;
    next_minutes INT;
BEGIN
    -- 使用 Supabase UI 或 service_key 不受限制
    IF is_supabase_ui_or_service_key() THEN 
        RETURN NEW;
    END IF;

    -- 從 settings 表中獲取預約時間單位
    SELECT VALUE::INT INTO reservation_time_unit FROM settings WHERE key_name = 'reservation_time_unit';

    -- 計算當前時間點的下一個時間單位
    total_minutes := EXTRACT(HOUR FROM current_timestamp) * 60 + EXTRACT(MINUTE FROM current_timestamp);
    next_minutes := ((total_minutes / reservation_time_unit) + 1) * reservation_time_unit;
    next_time_unit := date_trunc('day', current_timestamp) + make_interval(mins := next_minutes);

    -- 計算該預約開始日期的當天結束時間點，即當天的 23:59:59
    end_of_day := CAST(NEW.begin_time AS DATE) + INTERVAL '23 hours 59 minutes 59 seconds';

    -- 檢查是否該用戶在預約的當天有未完成的預約
    IF EXISTS (
        SELECT 1
        FROM reservations
        WHERE user_id = NEW.user_id
        AND CAST(begin_time AS DATE) = CAST(NEW.begin_time AS DATE) -- 確保是同一天
        AND end_time <= end_of_day
        AND end_time > next_time_unit -- 如果結束時間在下一個時間段之後，則視為未完成
    ) THEN 
        RAISE EXCEPTION '{"code":"R0007"}';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 在新增前檢查用戶當天是否有未完成的預約
DROP TRIGGER IF EXISTS trigger_check_unfinished_reservation ON reservations;
CREATE TRIGGER trigger_check_unfinished_reservation
BEFORE INSERT ON reservations
FOR EACH ROW EXECUTE FUNCTION check_unfinished_reservation();

-- 檢查是否可以刪除預約
CREATE OR REPLACE FUNCTION check_if_reservation_can_be_deleted() RETURNS TRIGGER AS $$
BEGIN
    -- 使用 Supabase UI 或 service_key 不受限制
    IF is_supabase_ui_or_service_key() THEN 
        RETURN OLD;
    END IF;

    -- 檢查是否嘗試刪除的預約的開始時間在當前時間後
    IF (OLD.begin_time <= current_timestamp) THEN 
        RAISE EXCEPTION '{"code":"R0008"}';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 在刪除預約前檢查是否可以進行刪除
DROP TRIGGER IF EXISTS trigger_check_if_reservation_can_be_deleted ON reservations;
CREATE TRIGGER trigger_check_if_reservation_can_be_deleted
BEFORE DELETE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_if_reservation_can_be_deleted();

/* ==========================
 * UTILS FUNCTION
 * ==========================
 */

/*
取得當前用戶的預約資料及個人資訊，但會受到權限限制，例如一般使用者只會返回自己的資料
函數支持多種過濾條件和分頁功能，以便調用者可以根據具體需求獲取數據

- 參數:
- page_size: 每頁的大小 (默認為 10)，控制返回的記錄數量
- page_offset: 頁偏移量 (默認為 0)，用於分頁中跳過前n條記錄
- filter_user_id: 用戶ID過濾條件，如果指定，則只返回該用戶的預約資訊
- filter_user_role: 用戶角色過濾條件，用於基於角色過濾記錄
- filter_seat_id: 座位ID過濾條件，如果指定，則只返回指定座位的預約
- filter_begin_time_start: 預約開始時間的起始過濾，用於範圍查詢
- filter_begin_time_end: 預約開始時間的結束過濾，用於範圍查詢
- filter_end_time_start: 預約結束時間的起始過濾，用於範圍查詢
- filter_end_time_end: 預約結束時間的結束過濾，用於範圍查詢

- 返回值:
- 預約相關字段：
- id: 預約ID
- begin_time: 預約開始時間
- end_time: 預約結束時間
- seat_id: 預約座位ID
- check_in_time: 簽到時間
- temporary_leave_time: 臨時離開時間
- 用戶相關資訊：
- user_id: 用戶ID
- email: 電子郵件
- user_role: 用戶角色
- admin_role: 管理員角色
- is_in: 是否在場
- name: 姓名
- phone: 電話號碼
- id_card: 身份證號
- point: 積分
- reason: 黑名單原因
- end_at: 黑名單結束時間
 */
CREATE OR REPLACE FUNCTION get_reservations (
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0,
    filter_user_id UUID DEFAULT NULL,
    filter_user_role TEXT DEFAULT NULL,
    filter_seat_id INT8 DEFAULT NULL,
    filter_begin_time_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_begin_time_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_end_time_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_end_time_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE (
    -- 預約相關字段
    id UUID,
    begin_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    seat_id INT8,
    check_in_time TIMESTAMP WITH TIME ZONE,
    temporary_leave_time TIMESTAMP WITH TIME ZONE,
    -- 用戶相關資訊
    user_id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
    is_in BOOLEAN,
    name TEXT,
    phone TEXT,
    id_card TEXT,
    point INT,
    reason TEXT,
    end_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        res.id,
        res.begin_time,
        res.end_time,
        res.seat_id,
        res.check_in_time,
        res.temporary_leave_time,
        user_data.id AS user_id,
        user_data.email,
        user_data.user_role,
        user_data.admin_role,
        user_data.is_in,
        user_data.name,
        user_data.phone,
        user_data.id_card,
        user_data.point,
        user_data.reason,
        user_data.end_at
    FROM
        reservations res
        CROSS JOIN LATERAL get_user_data(
            2147483647, 
            NULL, 
            filter_user_id, 
            NULL, 
            filter_user_role, 
            NULL, 
            NULL, 
            NULL
        ) AS user_data
    WHERE
        (res.user_id = user_data.id) AND
        (filter_seat_id IS NULL OR res.seat_id = filter_seat_id) AND
        (filter_begin_time_start IS NULL OR res.begin_time >= filter_begin_time_start) AND
        (filter_begin_time_end IS NULL OR res.begin_time <= filter_begin_time_end) AND
        (filter_end_time_start IS NULL OR res.end_time >= filter_end_time_start) AND
        (filter_end_time_end IS NULL OR res.end_time <= filter_end_time_end)
    ORDER BY
        res.begin_time DESC -- 確保結果有一致的排序
    LIMIT
        page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

/*
取得當前活躍的預約資料及個人資訊
此函數支持多種過濾條件，以便根據用戶需求提供特定的數據集，並且具備分頁功能，適用於需要處理大量數據的情況

- 參數:
- page_size: 每頁顯示的預約記錄數目，默認為 10
- page_offset: 預約記錄的偏移量，用於分頁，默認為 0
- filter_user_id: 用戶ID過濾條件，若提供，則只返回該用戶的預約資料
- filter_user_role: 用戶角色過濾條件，若提供，則只返回對應角色的用戶的預約資料
- filter_seat_id: 座位ID過濾條件，若提供，則只返回該座位的預約資料
- filter_begin_time_start: 預約開始時間的最早界限，用於篩選在此時間後開始的預約
- filter_begin_time_end: 預約開始時間的最晚界限，用於篩選在此時間前開始的預約
- filter_end_time_start: 預約結束時間的最早界限，用於篩選在此時間後結束的預約
- filter_end_time_end: 預約結束時間的最晚界限，用於篩選在此時間前結束的預約

- 返回值:
- 預約資訊（reservation）：
- id: 預約的唯一識別碼
- begin_time: 預約開始時間
- end_time: 預約結束時間
- seat_id: 預約的座位ID
- check_in_time: 預約的簽到時間
- temporary_leave_time: 預約期間的臨時離開時間
- 用戶資料（user_data）：
- user_id: 用戶的唯一識別碼
- email: 用戶的電子郵件地址
- user_role: 用戶的角色
- admin_role: 若用戶為管理員，其管理角色
- is_in: 用戶是否在場
- name: 用戶的姓名
- phone: 用戶的電話號碼
- id_card: 用戶的身份證號碼
- point: 用戶的積分
- reason: 若用戶被列入黑名單，其原因
- end_at: 黑名單結束時間
 */
CREATE OR REPLACE FUNCTION get_active_reservations (
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0,
    filter_user_id UUID DEFAULT NULL,
    filter_user_role TEXT DEFAULT NULL,
    filter_seat_id INT8 DEFAULT NULL,
    filter_begin_time_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_begin_time_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_end_time_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    filter_end_time_end TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS TABLE (
    -- reservation
    id UUID,
    begin_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    seat_id int8,
    check_in_time TIMESTAMP WITH TIME ZONE,
    temporary_leave_time TIMESTAMP WITH TIME ZONE,
    -- user_data
    user_id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
    is_in BOOLEAN,
    name TEXT,
    phone TEXT,
    id_card TEXT,
    point INT,
    reason TEXT,
    end_at TIMESTAMP WITH TIME ZONE
) AS $$ BEGIN
    RETURN QUERY
    SELECT
        res.id,
        res.begin_time,
        res.end_time,
        res.seat_id,
        res.check_in_time,
        res.temporary_leave_time,
        user_data.id,
        user_data.email,
        user_data.user_role,
        user_data.admin_role,
        user_data.is_in,
        user_data.name,
        user_data.phone,
        user_data.id_card,
        user_data.point,
        user_data.reason,
        user_data.end_at
    FROM
        active_reservations res
        CROSS JOIN LATERAL get_user_data(
            2147483647, 
            NULL, 
            filter_user_id, 
            NULL, 
            filter_user_role, 
            NULL, 
            NULL, 
            NULL
        ) AS user_data
    WHERE
        (res.user_id = user_data.id) AND
        (filter_seat_id IS NULL OR res.seat_id = filter_seat_id) AND
        (filter_begin_time_start IS NULL OR res.begin_time >= filter_begin_time_start) AND
        (filter_begin_time_end IS NULL OR res.begin_time <= filter_begin_time_end) AND
        (filter_end_time_start IS NULL OR res.end_time >= filter_end_time_start) AND
        (filter_end_time_end IS NULL OR res.end_time <= filter_end_time_end)
    ORDER BY
        res.begin_time DESC -- 確保結果有一致的排序
    LIMIT
        page_size OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;