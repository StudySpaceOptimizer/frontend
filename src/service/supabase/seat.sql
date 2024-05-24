-- 創建座位表
CREATE TABLE IF NOT EXISTS seats (
    id int8 PRIMARY KEY,
    available boolean NOT NULL,
    other_info text
);

-- 啟用 RLS
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

-- 允許管理員查詢和修改
DROP POLICY IF EXISTS admin_select ON seats;
CREATE POLICY admin_select ON seats
AS PERMISSIVE
FOR SELECT
USING (is_claims_admin());

DROP POLICY IF EXISTS admin_update ON seats;
CREATE POLICY admin_update ON seats
AS PERMISSIVE
FOR UPDATE
USING (is_claims_admin())
WITH CHECK (is_claims_admin());


-- 允許使用者查詢
DROP POLICY IF EXISTS user_select ON seats;
CREATE POLICY user_select ON seats
AS PERMISSIVE
FOR SELECT
USING (true);


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
