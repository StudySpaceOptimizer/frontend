/**
- 如果沒有提供 user_id，則檢查是否有管理權限 (is_claims_admin())，如果有，返回所有用戶數據
- 如果提供了 user_id：
    - 如果 user_id 等於 auth.uid()（當前認證用戶ID），則返回該用戶的數據
    - 如果 user_id 不等於 auth.uid()，則再次檢查是否有管理權限，如果有，返回指定 user_id 的用戶數據
*/
CREATE OR REPLACE FUNCTION get_user_data(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
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
)
AS $$
DECLARE
    current_user_id UUID := auth.uid();  -- 獲取當前認證用戶的ID
BEGIN
    IF p_user_id IS NULL THEN
        IF is_claims_admin() THEN
            -- 如果沒有提供 p_user_id 且用戶是管理員，返回所有用戶數據
            RETURN QUERY
            SELECT
                up.id,
                up.email,
                claims ->> 'user_role' as user_role,
                claims ->> 'admin_role' as admin_role,
                up.is_in,
                up.name,
                up.phone,
                up.id_card,
                up.point,
                ab.reason,
                ab.end_at
            FROM
                user_profiles up
            LEFT JOIN LATERAL (
                SELECT
                    ab.reason,
                    ab.end_at
                FROM
                    active_blacklist ab
                WHERE
                    ab.user_id = up.id
                ORDER BY
                    ab.end_at DESC
                LIMIT 1
            ) ab ON TRUE
            CROSS JOIN LATERAL
                get_claims(up.id) as claims;
        ELSE
            -- 如果不是管理員且沒有提供 p_user_id，返回錯誤
            RAISE EXCEPTION '需要提供用戶ID或有管理權限';
        END IF;
    ELSE
        -- 檢查提供的 p_user_id 是否與當前用戶ID相同，或者用戶是否是管理員
        IF p_user_id = current_user_id OR is_claims_admin() THEN
            -- 返回指定用戶數據
            RETURN QUERY
            SELECT
                up.id,
                up.email,
                claims ->> 'user_role' as user_role,
                claims ->> 'admin_role' as admin_role,
                up.is_in,
                up.name,
                up.phone,
                up.id_card,
                up.point,
                ab.reason,
                ab.end_at
            FROM
                user_profiles up
            LEFT JOIN LATERAL (
                SELECT
                    ab.reason,
                    ab.end_at
                FROM
                    active_blacklist ab
                WHERE
                    ab.user_id = up.id
                ORDER BY
                    ab.end_at DESC
                LIMIT 1
            ) ab ON TRUE
            CROSS JOIN LATERAL
                get_claims(up.id) as claims
            WHERE
                up.id = p_user_id;
        ELSE
            -- 如果不滿足身份檢查，返回錯誤
            RAISE EXCEPTION '沒有足夠權限查看指定用戶資料';
        END IF;
    END IF;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;



-- 取得當前用戶的預約資料及個人資訊
CREATE OR REPLACE FUNCTION get_my_reservations(page_size INT DEFAULT 10, page_offset INT DEFAULT 0)
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
        Reservations res
    CROSS JOIN LATERAL
        get_user_data(auth.uid()) as user_data
    WHERE
        auth.uid() = res.user_id
    ORDER BY res.begin_time DESC  -- 確保結果有一致的排序
    LIMIT page_size OFFSET page_offset;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;


-- 根據座位ID取得該座位的活躍預約資訊及預約用戶的個人資料
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
