-- 創建座位預約表，隱藏使用者的 ID
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


/* ==========================
 * RLS
 * ==========================
 */

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


/* ==========================
 * TRIGGER
 * ==========================
 */

-- 當 reservations 表有新的插入或更新時，同步至 seat_reservations 表
CREATE OR REPLACE FUNCTION sync_seat_reservations()
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

DROP TRIGGER IF EXISTS trigger_sync_seat_reservations ON reservations;
CREATE TRIGGER trigger_sync_seat_reservations
AFTER INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION sync_seat_reservations();


/* ==========================
 * UTILS FUNCTION
 * ==========================
 */

/*
  根據座位ID取得該座位的活躍預約資訊及預約用戶的個人資料
  - 參數:
      - p_seat_id: 座位ID (必須提供)

  Example:
    SELECT * FROM get_seat_active_reservations(1);
*/
CREATE OR REPLACE FUNCTION get_seat_active_reservations(p_seat_id INT DEFAULT NULL)
RETURNS TABLE(
    -- reservation
    id UUID,
    begin_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    seat_id int8,
    check_in_time timestamp with time zone,
    temporary_leave_time timestamp with time zone,

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
) AS $$
BEGIN
    IF p_seat_id IS NULL THEN
        RAISE EXCEPTION '需要提供座位ID參數';
    ELSE
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
        CROSS JOIN LATERAL
            get_user_data(res.user_id) as user_data
        WHERE
            res.seat_id = p_seat_id;
    END IF;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;
