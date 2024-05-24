DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM('student', 'outsider');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM('admin', 'assistant', 'non-admin');
    END IF;
END
$$;

-- 創建用戶個人資料表
CREATE TABLE IF NOT EXISTS user_profiles (
    -- 用戶本人可以選擇
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_in BOOLEAN NOT NULL, -- 表示是否在場內
    point INTEGER DEFAULT 0 NOT NULL,

    -- 用戶本人可以選擇、更新
    name TEXT,
    phone TEXT,
    id_card TEXT
);

-- 啟用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON user_profiles;
CREATE POLICY admin_all_access ON user_profiles
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許用戶存取自己的資料
DROP POLICY IF EXISTS user_select_own ON user_profiles;
CREATE POLICY user_select_own ON user_profiles
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = id);

-- 允許用戶更新自己的資料
DROP POLICY IF EXISTS user_update_own ON user_profiles;
CREATE POLICY user_update_own ON user_profiles
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 限制非管理員的更新範圍
CREATE OR REPLACE FUNCTION cls_user_profiles_update()
RETURNS TRIGGER AS
$$
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
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;

-- 在更新前檢查用戶個人資料更新條件
DROP TRIGGER IF EXISTS trigger_cls_user_profiles_update ON user_profiles;
CREATE TRIGGER trigger_cls_user_profiles_update
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION cls_user_profiles_update();


-- 根據用戶的email後綴來設置用戶角色及管理員角色，並儲存於 meta_data
CREATE OR REPLACE FUNCTION handle_new_user_metadata()
RETURNS TRIGGER
AS $$
DECLARE
    user_role user_role;
    admin_role admin_role;
BEGIN
    -- 根據email後綴確定用戶角色(userrole)
    IF NEW.email LIKE '%@mail.ntou.edu.tw' THEN
        -- 學生
        user_role := 'student';
    ELSE
        -- 校外人士
        user_role := 'outsider';
    END IF;

    admin_role := 'non-admin';

    -- 更新 raw_app_meta_data
    -- 設置 userrole
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('user_role', user_role);
    -- 設置 claims_admin
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('admin_role', admin_role);

    RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增用戶記錄前執行 raw_app_meta_data 設置
DROP TRIGGER IF EXISTS trigger_handle_new_user_metadata ON auth.users;
CREATE TRIGGER trigger_handle_new_user_metadata
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_metadata();

-- 在用戶註冊時自動新增 user_profile
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
AS $$
BEGIN
    -- 插入新的 user_profile 記錄
    INSERT INTO user_profiles (id, email, is_in, point) VALUES (NEW.id, NEW.email, false, 0);

    RETURN NULL;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- 在新增用戶記錄後執行 user_profile 記錄的新增
DROP TRIGGER IF EXISTS trigger_handle_new_user_profile ON auth.users;
CREATE TRIGGER trigger_handle_new_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_profile();

-- 處理違規點數到達上限
CREATE OR REPLACE FUNCTION ban_user_if_points_exceed_limit()
RETURNS TRIGGER 
AS $$
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
$$ 
LANGUAGE plpgsql
SECURITY DEFINER;

-- 當user_profiles表的point欄位被更新時檢查違規點數是否到達上限
DROP TRIGGER IF EXISTS trigger_ban_user_if_points_exceed_limit ON user_profiles;
CREATE TRIGGER trigger_ban_user_if_points_exceed_limit
AFTER UPDATE OF point ON user_profiles
FOR EACH ROW
WHEN (OLD.point <> NEW.point)
EXECUTE FUNCTION ban_user_if_points_exceed_limit();




-- 創建黑名單表
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 為黑名單結束時間創建索引
CREATE INDEX IF NOT EXISTS idx_blacklist_end_at ON blacklist (end_at);

-- 創建視圖以篩選當前有效的黑名單記錄
CREATE OR REPLACE VIEW active_blacklist
WITH (security_invoker = on) AS
SELECT *
FROM public.blacklist
WHERE end_at > NOW();

-- 啟用 RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON blacklist;
CREATE POLICY admin_all_access ON blacklist
AS PERMISSIVE
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許用戶查詢自己的黑名單記錄
DROP POLICY IF EXISTS user_select_own ON blacklist;
CREATE POLICY user_select_own ON blacklist
AS PERMISSIVE
FOR SELECT
USING (auth.uid() = user_id);


/**
- 檢查使用者是否被ban
- 如果會話使用者是 authenticator，則進一步檢查 JWT 中的 claims
- 首先檢查 JWT 是否已過期
- 如果 JWT 中的角色是 service_role，則回傳 false
- 如果使用者的 app_metadata 中的 banned 屬性為 true，則回傳 true
- 其他情況下，回傳 true
- example:
    select is_not_banned();
*/
CREATE OR REPLACE FUNCTION is_not_banned() 
RETURNS BOOLEAN
AS $$
DECLARE
is_banned BOOLEAN;
BEGIN
    IF session_user = 'authenticator' THEN
        -- 判断 JWT 是否過期
        IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        return false; -- jwt expired
        END IF;

        -- 判断 service_role
        If current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
        RETURN true;
        END IF;

        -- 檢查該用戶是否目前在黑名單中
        SELECT NOT EXISTS (
        SELECT 1 FROM active_blacklist
        WHERE auth.uid() = user_id
        ) INTO is_banned;

        RETURN is_banned;

    ELSE -- not a user session, probably being called from a trigger or something
        return true;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE
SECURITY INVOKER;

