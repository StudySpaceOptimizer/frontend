-- 創建用戶個人資料表
CREATE TABLE IF NOT EXISTS
    user_profiles (
        -- 用戶本人可以選擇
        id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        is_in BOOLEAN NOT NULL, -- 表示是否在場內
        point INTEGER DEFAULT 0 NOT NULL,
        -- 用戶本人可以選擇、更新
        name TEXT,
        phone TEXT,
        id_card TEXT
    );

/* ==========================
 * RLS
 * ==========================
 */
-- 啟用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON user_profiles;

CREATE POLICY admin_all_access ON user_profiles AS PERMISSIVE FOR ALL USING (is_claims_admin ())
WITH
    CHECK (is_claims_admin ());

-- 允許用戶存取自己的資料
DROP POLICY IF EXISTS user_select_own ON user_profiles;

CREATE POLICY user_select_own ON user_profiles AS PERMISSIVE FOR
SELECT
    USING (auth.uid () = id);

-- 允許用戶更新自己的資料
DROP POLICY IF EXISTS user_update_own ON user_profiles;

CREATE POLICY user_update_own ON user_profiles AS PERMISSIVE FOR
UPDATE USING (auth.uid () = id)
WITH
    CHECK (auth.uid () = id);

/* ==========================
 * CLS
 * ==========================
 */
-- 限制非管理員的更新範圍
CREATE
OR REPLACE FUNCTION cls_user_profiles_update () RETURNS TRIGGER AS $$
BEGIN
    -- 使用 supabase UI 或 service_key 不受限制
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    -- 若為管理員，允許任何更新
    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    -- 對於非管理員，確保只能更新 name、phone、id_card
    IF NEW.id != OLD.id OR NEW.email != OLD.email OR NEW.is_in != OLD.is_in OR NEW.point != OLD.point THEN
        RAISE EXCEPTION '使用者只能更新 name、phone、id_card 欄位';
    END IF;

    -- 確保更新操作由用戶本人發起
    IF auth.uid() != OLD.id THEN
        RAISE EXCEPTION '用戶只能更新自己的記錄';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 在更新前檢查用戶個人資料更新條件
DROP TRIGGER IF EXISTS trigger_cls_user_profiles_update ON user_profiles;

CREATE TRIGGER trigger_cls_user_profiles_update BEFORE
UPDATE ON user_profiles FOR EACH ROW
EXECUTE FUNCTION cls_user_profiles_update ();

/* ==========================
 * TRIGGER
 * ==========================
 */
-- 根據用戶的 email 來設置用戶角色及管理員角色，並儲存於 meta_data
CREATE
OR REPLACE FUNCTION set_user_metadata () RETURNS TRIGGER AS $$
DECLARE
    userrole public.user_role;
    adminrole public.admin_role;
BEGIN
    -- 根據 email 確定用戶角色(userrole)
    IF NEW.email LIKE '%@mail.ntou.edu.tw' THEN
        -- 學生
        userrole := 'student';
    ELSE
        -- 校外人士
        userrole := 'outsider';
    END IF;

    adminrole := 'non-admin';

    -- 更新 raw_app_meta_data
    -- 設置 userrole
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('user_role', userrole);
    -- 設置 claims_admin
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('admin_role', adminrole);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在新增用戶記錄前執行 raw_app_meta_data 設置
DROP TRIGGER IF EXISTS trigger_set_user_metadata ON auth.users;

CREATE TRIGGER trigger_set_user_metadata BEFORE INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION set_user_metadata ();

-- 在用戶註冊時自動新增 user_profile
CREATE
OR REPLACE FUNCTION create_user_profile () RETURNS TRIGGER AS $$
BEGIN
    -- 插入新的 user_profile 記錄
    INSERT INTO user_profiles (id, email, is_in, point) VALUES (NEW.id, NEW.email, false, 0);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在新增用戶記錄後執行 user_profile 記錄的新增
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;

CREATE TRIGGER trigger_create_user_profile
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION create_user_profile ();

-- 處理違規點數到達上限
CREATE
OR REPLACE FUNCTION ban_user_on_points_limit () RETURNS TRIGGER AS $$
DECLARE
    points_to_ban_user INT;
BEGIN
    SELECT value::int INTO points_to_ban_user FROM settings WHERE key_name = 'points_to_ban_user';

    -- 檢查點數是否大於或等於7
    IF NEW.point >= points_to_ban_user THEN
        -- 將點數重設為0
        NEW.point := 0;

        
        -- 將使用者加入blacklist
        INSERT INTO blacklist (user_id, reason, end_at)
        VALUES (NEW.id, '違規點數達到上限', CURRENT_TIMESTAMP + INTERVAL '30 days');

        -- 更新使用者的點數
        UPDATE user_profiles SET point = 0 WHERE id = NEW.id;
    END IF;

    -- 返回更新後的記錄
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 當 user_profiles 表的 point 欄位被更新時檢查違規點數是否到達上限
DROP TRIGGER IF EXISTS trigger_ban_user_on_points_limit ON user_profiles;

CREATE TRIGGER trigger_ban_user_on_points_limit
AFTER
UPDATE OF point ON user_profiles FOR EACH ROW WHEN (OLD.point <> NEW.point)
EXECUTE FUNCTION ban_user_on_points_limit ();

/* ==========================
 * UTILS FUNCTION
 * ==========================
 */
/*
根據用戶ID獲取用戶數據，如果沒有提供用戶ID，則檢查管理員權限
- 如果沒有提供 user_id，則檢查是否有管理權限 (is_claims_admin())，如果有，返回所有用戶數據
- 如果提供了 user_id：
- 如果 user_id 等於 auth.uid()（當前認證用戶ID），則返回該用戶的數據
- 如果 user_id 不等於 auth.uid()，則再次檢查是否有管理權限，如果有，返回指定 user_id 的用戶數據

Example:
SELECT * FROM get_user_data();
SELECT * FROM get_user_data('72e699aa-d50c-4ee3-9eb6-e29c169b5eff');
 */
CREATE
OR REPLACE FUNCTION get_user_data (
    p_user_id UUID DEFAULT NULL,
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0
) RETURNS TABLE (
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
) AS $$
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
                get_claims(up.id) as claims
            ORDER BY up.id  -- 添加排序以確保結果一致
            LIMIT page_size OFFSET page_offset;
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
                up.id = p_user_id
            ORDER BY up.id  -- 添加排序以確保結果一致
            LIMIT page_size OFFSET page_offset;
        ELSE
            -- 如果不滿足身份檢查，返回錯誤
            RAISE EXCEPTION '沒有足夠權限查看指定用戶資料';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

CREATE
OR REPLACE FUNCTION test_get_user_data (
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0
) RETURNS TABLE (
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
) AS $$ 
BEGIN
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
    ORDER BY up.id  -- 添加排序以確保結果一致
    LIMIT page_size OFFSET page_offset;
 
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;