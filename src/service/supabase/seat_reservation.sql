-- 創建座位預約表，此表存儲座位預約信息，並且關聯到reservations表以追蹤特定預約
CREATE TABLE IF NOT EXISTS seat_reservations (
    seat_id INT8 NOT NULL,
    begin_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reservation_id UUID NOT NULL,
    CONSTRAINT fk_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE,
    CONSTRAINT fk_seat_id FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE CASCADE,
    PRIMARY KEY (seat_id, begin_time, end_time)
);

-- 為座位預約表的結束時間創建索引，以優化查詢效率
CREATE INDEX IF NOT EXISTS idx_seat_reservations_end_time ON seat_reservations (end_time);

-- 創建視圖以篩選出活躍的座位預約，即預約尚未結束的座位
CREATE OR REPLACE VIEW active_seat_reservations
WITH (security_invoker = on) AS
SELECT *
FROM public.seat_reservations
WHERE end_time > NOW();

/* ==========================
 * RLS
 * ==========================
 */

-- 啟用RLS
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- 為管理員創建政策，允許對座位預約表進行所有操作
DROP POLICY IF EXISTS admin_all_access ON seat_reservations;
CREATE POLICY admin_all_access ON seat_reservations AS PERMISSIVE FOR ALL USING (is_claims_admin()) WITH CHECK (is_claims_admin());

-- 為所有用戶創建查詢政策，允許查詢座位預約時段
DROP POLICY IF EXISTS select_policy ON seat_reservations;
CREATE POLICY select_policy ON seat_reservations AS PERMISSIVE FOR SELECT USING (true);

/* ==========================
 * TRIGGER
 * ==========================
 */

-- 當reservations表有新的插入或更新時，同步這些變更到seat_reservations表
CREATE OR REPLACE FUNCTION sync_seat_reservations() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO seat_reservations (seat_id, begin_time, end_time, reservation_id)
    SELECT NEW.seat_id, NEW.begin_time, NEW.end_time, NEW.id
    FROM reservations
    WHERE id = NEW.id
    ON CONFLICT (seat_id, begin_time, end_time) DO UPDATE
        SET reservation_id = EXCLUDED.reservation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 設置觸發器以在reservations表插入或更新時觸發上述同步函數
DROP TRIGGER IF EXISTS trigger_sync_seat_reservations ON reservations;
CREATE TRIGGER trigger_sync_seat_reservations AFTER INSERT OR UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION sync_seat_reservations();

/* ==========================
 * UTILS FUNCTION
 * ==========================
 */

-- 根據座位ID取得該座位的活躍預約資訊及預約用戶的個人資料，使用交叉連接搭配用戶資料函數
CREATE OR REPLACE FUNCTION get_seat_active_reservations (p_seat_id INT DEFAULT NULL) RETURNS TABLE (
  id UUID,
  begin_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  seat_id INT8,
  check_in_time TIMESTAMP WITH TIME ZONE,
  temporary_leave_time TIMESTAMP WITH TIME ZONE,
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
  IF p_seat_id IS NULL THEN
    RAISE EXCEPTION '{"code":"P0001"}';
  END IF;

  RETURN QUERY
  SELECT
    res.id,
    res.begin_time,
    res.end_time,
    res.seat_id,
    res.check_in_time,
    res.temporary_leave_time,
    user_data.u_id,
    user_data.u_email,
    user_data.u_user_role,
    user_data.u_admin_role,
    user_data.u_is_in,
    user_data.u_name,
    user_data.u_phone,
    user_data.u_id_card,
    user_data.u_point,
    user_data.u_reason,
    user_data.u_end_at
  FROM
    active_reservations res,
    LATERAL (
      SELECT 
        u.id AS u_id,
        u.email AS u_email,
        u.user_role AS u_user_role,
        u.admin_role AS u_admin_role,
        u.is_in AS u_is_in,
        u.name AS u_name,
        u.phone AS u_phone,
        u.id_card AS u_id_card,
        u.point AS u_point,
        u.reason AS u_reason,
        u.end_at AS u_end_at
      FROM
        get_user_data(2147483647, 0, res.user_id, NULL, NULL, NULL, NULL, NULL) u
    ) AS user_data
  WHERE res.seat_id = p_seat_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;