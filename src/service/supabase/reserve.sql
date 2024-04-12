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
USING (auth.uid() = id);

-- 允許使用者新增自己的預約
CREATE POLICY user_insert_own ON reservations
AS PERMISSIVE
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_not_banned());


-- 檢查合法預約：begin 跟 end 在同一天且end在begin之後
CREATE OR REPLACE FUNCTION check_reservation_validity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 檢查begin_time和end_time是否在同一天
  IF DATE(TRUNC('day', NEW.begin_time)) != DATE(TRUNC('day', NEW.end_time)) THEN
    RAISE EXCEPTION '開始和結束時間必須在同一天';
  END IF;
  -- 檢查end_time是否在begin_time之後
  IF NEW.end_time <= NEW.begin_time THEN
    RAISE EXCEPTION '結束時間必須晚於開始時間';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_reservation_validity ON reservations;
CREATE TRIGGER trigger_check_reservation_validity
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_validity();


-- 檢查座位可用性和預約時間重疊
CREATE OR REPLACE FUNCTION check_seat_availability_and_overlap()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 檢查選定座位是否可用
    IF (SELECT NOT available FROM seats WHERE id = NEW.seat_id) THEN
        RAISE EXCEPTION '所選座位不可用';
    END IF;

    -- 檢查預約時間是否與同一座位的其他預約重疊
    IF EXISTS (
        SELECT 1 FROM active_seat_timeslots
        WHERE seat_id = NEW.seat_id
        AND   (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN
        RAISE EXCEPTION '預約時間與現有預約重疊';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_seat_availability_and_overlap ON reservations;
CREATE TRIGGER trigger_check_seat_availability_and_overlap
BEFORE INSERT ON reservations
FOR EACH ROW EXECUTE FUNCTION check_seat_availability_and_overlap();


-- 檢查預約設定限制
CREATE OR REPLACE FUNCTION verify_reservation_limits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    weekdayOpening TIME;
    weekdayClosing TIME;
    weekendOpening TIME;
    weekendClosing TIME;
    minimumDuration int;
    maximumDuration int;
    studentLimit int;

    reservationDuration INT;
BEGIN

    -- 從設定中提取時間和限制
    SELECT (Value::jsonb)->>'begin', (Value::jsonb)->>'end' INTO weekdayOpening, weekdayClosing FROM settings WHERE KeyName = 'weekdayOpeningHours';
    SELECT (Value::jsonb)->>'begin', (Value::jsonb)->>'end' INTO weekendOpening, weekendClosing FROM settings WHERE KeyName = 'weekendOpeningHours';
    SELECT Value::int INTO minimumDuration FROM settings WHERE KeyName = 'minimumReservationDuration';
    SELECT Value::int INTO maximumDuration FROM settings WHERE KeyName = 'maximumReservationDuration';
    SELECT Value::int INTO studentLimit FROM settings WHERE KeyName = 'studentReservationLimit';

    -- 計算預約時長
    reservationDuration := EXTRACT(EPOCH FROM (NEW.end_time - NEW.begin_time))/3600;

    -- 判斷是否為工作日或周末，並檢查開放時間
    IF EXTRACT(ISODOW FROM NEW.begin_time) BETWEEN 1 AND 5 THEN
        -- 工作日
        IF NEW.begin_time::time < weekdayOpening OR NEW.end_time::time > weekdayClosing THEN
            RAISE EXCEPTION '預約時間必須在工作日的開放時間內';
        END IF;
    ELSE
        -- 周末
        IF NEW.begin_time::time < weekendOpening OR NEW.end_time::time > weekendClosing THEN
            RAISE EXCEPTION '預約時間必須在周末的開放時間內';
        END IF;
    END IF;

    -- 檢查預約時長是否合法
    IF reservationDuration < minimumDuration OR reservationDuration > maximumDuration THEN
        RAISE EXCEPTION '預約時長必須介於 % 和 % 小時之間', minimumDuration, maximumDuration;
    END IF;

    -- 檢查學生預約是否在可提前預約的日期內
    IF (NEW.begin_time::date - CURRENT_DATE) > advanceReservationDays THEN
        RAISE EXCEPTION '學生只能提前 % 天進行預約', advanceReservationDays;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_verify_reservation ON reservations;
CREATE TRIGGER trigger_verify_reservation
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION verify_reservation_limits();


-- 檢查是否與關閉時間重疊
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 檢查新的預約時間是否與任何已存在的關閉時段重疊
    IF EXISTS (
        SELECT 1
        FROM active_closed_periods
        WHERE (NEW.begin_time, NEW.end_time) OVERLAPS (begin_time, end_time)
    ) THEN
        RAISE EXCEPTION '預約時間與關閉時段重疊';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_reservation_overlap ON reservations;
CREATE TRIGGER trigger_check_reservation_overlap
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();


-- 檢查用戶當天是否有未完成的預約
CREATE OR REPLACE FUNCTION check_for_unfinished_reservations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    -- 宣告 next_half_hour 和 end_of_day 兩個 TIMESTAMP 變數，用於計算時間點
    next_half_hour TIMESTAMP;
    end_of_day TIMESTAMP;
BEGIN
    -- 計算下一個30分鐘的時間點，如果當前分鐘數大於或等於30，則下一個半小時時間點為下一個整點；否則為當前小時的30分
    next_half_hour := DATE_TRUNC('hour', CURRENT_TIMESTAMP) + 
                      CASE
                          WHEN EXTRACT(minute FROM CURRENT_TIMESTAMP) >= 30 THEN INTERVAL '1 hour'
                          ELSE INTERVAL '30 minutes'
                      END;
    
    -- 計算當天結束的時間點，即當天的 23:59:59
    end_of_day := CURRENT_DATE + INTERVAL '23 hours 59 minutes 59 seconds';

    -- 檢查是否用戶今天有未完成的預約
    IF EXISTS (
        SELECT 1
        FROM reservations
        WHERE user_id = NEW.user_id
        -- 預約的開始日期為當天
        AND CAST(begin_time AS DATE) = CURRENT_DATE
        -- 預約的結束時間在當天結束前
        AND end_time <= end_of_day
        -- 預約的結束時間在30分鐘之內
        AND end_time > next_half_hour
    ) THEN
        RAISE EXCEPTION '用戶今天有未完成的預約';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_for_unfinished_reservations ON reservations;
CREATE TRIGGER trigger_check_for_unfinished_reservations
BEFORE INSERT OR UPDATE ON reservations
FOR EACH ROW EXECUTE FUNCTION check_for_unfinished_reservations();






-- 創建座位預約表
CREATE TABLE IF NOT EXISTS seat_timeslots (
    seat_id int8 NOT NULL,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    reservation_id UUID NOT NULL,
    CONSTRAINT fk_reservation FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    PRIMARY KEY (seat_id, begin_time, end_time)
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_seat_timeslots_end_time ON seat_timeslots (end_time);

-- 創建視圖以篩選活躍的座位預約時段
CREATE OR REPLACE VIEW active_seat_timeslots
WITH (security_invoker = on) AS
SELECT *
FROM public.seat_timeslots
WHERE end_time > NOW();

-- 啟用RLS
ALTER TABLE seat_timeslots ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON seat_timeslots;
CREATE POLICY admin_all_access ON seat_timeslots
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許所有用戶查詢座位預約時段
DROP POLICY IF EXISTS select_policy ON seat_timeslots;
CREATE POLICY select_policy ON seat_timeslots 
AS PERMISSIVE
FOR SELECT 
USING (true);