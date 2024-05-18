-- 創建預約表
CREATE TABLE IF NOT EXISTS reservations(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    user_id uuid NOT NULL,
    seat_id int8 NOT NULL,
    check_in_time timestamp with time zone,
    temporary_leave_time timestamp with time zone,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_seat FOREIGN KEY(seat_id) REFERENCES seats(id) ON DELETE CASCADE 
);

-- 為預約紀錄結束時間創建索引
CREATE INDEX IF NOT EXISTS idx_reservations_end_time ON reservations (end_time);

-- 創建視圖以篩選當前有效的黑名單記錄
CREATE OR REPLACE VIEW active_reservations
WITH (security_invoker = on) AS
SELECT *
FROM public.reservations
WHERE end_time > NOW();

-- 啟用 RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON reservations;
CREATE POLICY admin_all_access ON reservations
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許使用者訪問自己的預約資料
DROP POLICY IF EXISTS user_select_own ON reservations;
CREATE POLICY user_select_own ON reservations
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = user_id);

-- 允許使用者新增自己的預約
DROP POLICY IF EXISTS user_insert_own ON reservations;
CREATE POLICY user_insert_own ON reservations
AS PERMISSIVE
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_not_banned());

-- 允許使用者刪除自己的預約
DROP POLICY IF EXISTS user_delete_own ON reservations;
CREATE POLICY user_delete_own ON reservations
AS PERMISSIVE
FOR DELETE
USING (auth.uid() = user_id);

-- 允許使用者更新自己的預約
DROP POLICY IF EXISTS user_update_own ON reservations;
CREATE POLICY user_update_own ON reservations
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 更新cls
CREATE OR REPLACE FUNCTION cls_reservations_update()
RETURNS TRIGGER AS
$$
BEGIN
    -- 若為管理員，允許任何更新
    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    -- 對於非管理員，確保只能更新 begin_time
    IF NEW.id != OLD.id OR NEW.begin_time != OLD.begin_time OR NEW.user_id != OLD.user_id OR NEW.seat_id != OLD.seat_id  OR NEW.check_in_time != OLD.check_in_time THEN
        RAISE EXCEPTION '使用者只能更新 begin_time 欄位';
    END IF;

    -- 確保更新操作由用戶本人發起
    IF auth.uid() != OLD.id THEN
        RAISE EXCEPTION '用戶只能更新自己的記錄';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;

-- 在更新前檢查用戶個人資料更新條件
DROP TRIGGER IF EXISTS trigger_cls_reservations_update ON reservations;
CREATE TRIGGER trigger_cls_reservations_update
BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION cls_reservations_update();

-- 確認提早離開是否合法
CREATE OR REPLACE FUNCTION check_terminate_reservation_validity()
RETURNS TRIGGER AS
$$
BEGIN
    -- 確認使用者是否已經報到
    IF NEW.check_in_time == NULL THEN
        RAISE EXCEPTION '尚未報到';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;

-- 在提早結束前檢查是否已經報到
DROP TRIGGER IF EXISTS trigger_check_terminate_reservation_validity ON reservations;
CREATE TRIGGER trigger_check_terminate_reservation_validity
BEFORE UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_terminate_reservation_validity();

-- 檢查預約的合法性
CREATE OR REPLACE FUNCTION check_reservation_validity()
RETURNS TRIGGER 
AS $$
BEGIN
    -- 檢查 begin_time 和 end_time 是否在同一天
    IF DATE(NEW.begin_time) != DATE(NEW.end_time) THEN
        RAISE EXCEPTION '開始和結束時間必須在同一天';
    END IF;

    -- 檢查 end_time 是否在 begin_time 之後
    IF NEW.end_time <= NEW.begin_time THEN
        RAISE EXCEPTION '結束時間必須晚於開始時間';
    END IF;

    -- 確保預約的開始和結束時間都是每小時的 00 分或 30 分
    -- 只在插入操作時進行檢查
    IF TG_OP = 'INSERT' THEN
        IF (EXTRACT(MINUTE FROM NEW.begin_time) NOT IN (0, 30)) OR (EXTRACT(MINUTE FROM NEW.end_time) NOT IN (0, 30)) THEN
            RAISE EXCEPTION '預約時間必須以30分鐘為單位';
        END IF;
    END IF;
    

    -- 確保預約開始時間大於當前時間
    IF NEW.begin_time <= current_timestamp THEN
        RAISE EXCEPTION '預約開始時間必須大於當前時間';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增或修改之前檢查合法預約
DROP TRIGGER IF EXISTS trigger_check_reservation_validity ON reservations;
CREATE TRIGGER trigger_check_reservation_validity
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_validity();


-- 檢查所選座位的可用性以及預約時間是否與現有預約時間重疊
CREATE OR REPLACE FUNCTION check_seat_availability_and_seat_reservations_overlap()
RETURNS TRIGGER 
AS $$
BEGIN
    -- 檢查選定座位是否可用
    IF (SELECT NOT available FROM seats WHERE id = NEW.seat_id) THEN
        RAISE EXCEPTION '所選座位不可用';
    END IF;

    -- 檢查預約時間是否與同一座位的其他預約重疊
    IF EXISTS (
        SELECT 1 FROM active_seat_reservations
        WHERE seat_id = NEW.seat_id
        AND   (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN
        RAISE EXCEPTION '預約時間與現有預約重疊';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增或修改之前檢查座位可用性和預約時間重疊
DROP TRIGGER IF EXISTS trigger_check_seat_availability_and_seat_reservations_overlap ON reservations;
CREATE TRIGGER trigger_check_seat_availability_and_seat_reservations_overlap
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_seat_availability_and_seat_reservations_overlap();


-- 檢查預約設定限制
CREATE OR REPLACE FUNCTION check_reservation_limits()
RETURNS TRIGGER 
AS $$
DECLARE
    weekday_opening TIME;
    weekday_closing TIME;
    weekend_opening TIME;
    weekend_closing TIME;
    minimum_duration INT;
    maximum_duration INT;
    student_limit INT;
    outsider_limit INT;

    reservation_duration INT;

    user_role user_role;
BEGIN

    -- 從設定中提取時間和限制
    SELECT (value::jsonb)->>'begin_time', (value::jsonb)->>'end_time' INTO weekday_opening, weekday_closing FROM settings WHERE key_name = 'weekday_opening_hours';
    SELECT (value::jsonb)->>'begin_time', (value::jsonb)->>'end_time' INTO weekend_opening, weekend_closing FROM settings WHERE key_name = 'weekend_opening_hours';
    SELECT value::numeric INTO minimum_duration FROM settings WHERE key_name = 'minimum_reservation_duration';
    SELECT value::numeric INTO maximum_duration FROM settings WHERE key_name = 'maximum_reservation_duration';
    SELECT value::int INTO student_limit FROM settings WHERE key_name = 'student_reservation_limit';
    SELECT value::int INTO outsider_limit FROM settings WHERE key_name = 'outsider_reservation_limit';

    -- 計算預約時長
    reservation_duration := EXTRACT(EPOCH FROM (NEW.end_time - NEW.begin_time)) / 3600;

    -- 判斷是否為工作日或周末，並檢查開放時間
    IF EXTRACT(ISODOW FROM NEW.begin_time) BETWEEN 1 AND 5 THEN
        -- 工作日
        IF NEW.begin_time::time < weekday_opening OR NEW.end_time::time > weekday_closing THEN
            RAISE EXCEPTION '預約時間必須在工作日的開放時間內';
        END IF;
    ELSE
        -- 周末
        IF NEW.begin_time::time < weekend_opening OR NEW.end_time::time > weekend_closing THEN
            RAISE EXCEPTION '預約時間必須在周末的開放時間內';
        END IF;
    END IF;

    -- 檢查預約時長是否合法
    -- 只在插入操作時進行檢查
    IF TG_OP = 'INSERT' THEN
        IF reservation_duration < minimum_duration OR reservation_duration > maximum_duration THEN
            RAISE EXCEPTION '預約時長必須介於 % 和 % 小時之間', minimum_duration, maximum_duration;
       END IF; 
    END IF;

    user_role := get_my_claim('user_role')->> '';

    -- 若不是管理員
    IF NOT is_claims_admin() THEN
        -- 檢查學生預約是否在可提前預約的日期內
        IF user_role = 'student' AND ((NEW.begin_time::date - CURRENT_DATE) > student_limit) THEN
            RAISE EXCEPTION '學生只能提前 % 天進行預約', student_limit;
        END IF;

        -- 檢查校外人士預約是否在可提前預約的日期內
        IF user_role = 'outsider' AND ((NEW.begin_time::date - CURRENT_DATE) > outsider_limit) THEN
            RAISE EXCEPTION '校外人士只能提前 % 天進行預約', outsider_limit;
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增或修改之前檢查預約設定限制
DROP TRIGGER IF EXISTS trigger_check_reservation_limits ON reservations;
CREATE TRIGGER trigger_check_reservation_limits
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_limits();


-- 檢查新的預約時間是否與任何已存在的關閉時段重疊，確保預約在開放時間內
CREATE OR REPLACE FUNCTION check_closed_periods_overlap()
RETURNS TRIGGER 
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM active_closed_periods
        WHERE (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN
        RAISE EXCEPTION '預約時間與關閉時段重疊';
    END IF;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增或修改之前檢查是否與關閉時間重疊
DROP TRIGGER IF EXISTS trigger_check_closed_periods_overlap ON reservations;
CREATE TRIGGER trigger_check_closed_periods_overlap
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_closed_periods_overlap();


-- 檢查用戶當天是否有未完成的預約(30分鐘內結束的預約不算在內)
CREATE OR REPLACE FUNCTION check_for_unfinished_reservation()
RETURNS TRIGGER
AS $$
DECLARE
    next_half_hour TIMESTAMP;
    end_of_day TIMESTAMP;
BEGIN
    -- 計算當前時間點的下一個30分鐘
    next_half_hour := DATE_TRUNC('hour', NOW()) + 
                      CASE
                          WHEN EXTRACT(minute FROM NOW()) >= 30 THEN INTERVAL '1 hour'
                          ELSE INTERVAL '30 minutes'
                      END;
    
    -- 計算該預約開始日期的當天結束時間點，即當天的 23:59:59
    end_of_day := CAST(NEW.begin_time AS DATE) + INTERVAL '23 hours 59 minutes 59 seconds';

    -- 檢查是否該用戶在預約的當天有未完成的預約
    IF EXISTS (
        SELECT 1
        FROM reservations
        WHERE user_id = NEW.user_id
        AND CAST(begin_time AS DATE) = CAST(NEW.begin_time AS DATE)  -- 確保是同一天
        AND end_time <= end_of_day
        AND end_time > next_half_hour -- 如果結束時間在下一個時間段之後，則視為未完成
    ) THEN
        RAISE EXCEPTION '用戶在預約當天有未完成的預約';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY INVOKER;

-- 在新增或修改之前檢查用戶當天是否有未完成的預約
DROP TRIGGER IF EXISTS trigger_check_for_unfinished_reservation ON reservations;
CREATE TRIGGER trigger_check_for_unfinished_reservation
BEFORE INSERT ON reservations
FOR EACH ROW EXECUTE FUNCTION check_for_unfinished_reservation();


-- 檢查是否可以刪除預約
CREATE OR REPLACE FUNCTION check_reservation_delete_time()
RETURNS TRIGGER AS $$
BEGIN
    -- 檢查是否嘗試刪除的預約的開始時間在當前時間後
    IF (OLD.begin_time <= current_timestamp) THEN
        RAISE EXCEPTION '只能刪除尚未開始的預約';
    END IF;
    RETURN OLD;
END;
$$
LANGUAGE plpgsql
SECURITY INVOKER;

-- 在新增或修改之前檢查是否可以刪除預約
DROP TRIGGER IF EXISTS trigger_check_reservation_delete ON reservations;
CREATE TRIGGER trigger_check_reservation_delete
BEFORE DELETE ON reservations
FOR EACH ROW
EXECUTE FUNCTION check_reservation_delete_time();



-- 創建座位預約表
CREATE TABLE IF NOT EXISTS seat_reservations (
    seat_id int8 NOT NULL,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reservation_id UUID NOT NULL,
    CONSTRAINT fk_reservation FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_id FOREIGN KEY(seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    PRIMARY KEY (seat_id, begin_time, end_time)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_seat_reservations_end_time ON seat_reservations (end_time);

-- 創建視圖以篩選活躍的座位預約時段
CREATE OR REPLACE VIEW active_seat_reservations
WITH (security_invoker = on) AS
SELECT *
FROM public.seat_reservations
WHERE end_time > NOW();

-- 啟用RLS
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON seat_reservations;
CREATE POLICY admin_all_access ON seat_reservations
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許所有用戶查詢座位預約時段
DROP POLICY IF EXISTS select_policy ON seat_reservations;
CREATE POLICY select_policy ON seat_reservations 
AS PERMISSIVE
FOR SELECT 
USING (true);

-- 當 reservations 表有新的插入或更新時，將相應數據插入至 seat_reservations 表
CREATE OR REPLACE FUNCTION update_seat_reservations()
RETURNS TRIGGER
AS $$
BEGIN
    INSERT INTO seat_reservations (seat_id, begin_time, end_time, reservation_id)
    SELECT NEW.seat_id, NEW.begin_time, NEW.end_time, NEW.id
    FROM reservations
    WHERE id = NEW.id
    ON CONFLICT (seat_id, begin_time, end_time) DO UPDATE
        SET reservation_id = EXCLUDED.reservation_id;
    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_seat_reservations ON reservations;
CREATE TRIGGER trigger_update_seat_reservations
AFTER INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_seat_reservations();
