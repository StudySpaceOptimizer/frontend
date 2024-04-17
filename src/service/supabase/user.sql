/**
- 自訂枚舉類型 userrole
- 學生: student
- 校外人士: outsider
*/
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

-- 創建觸發器函數以限制非管理員的更新範圍
CREATE OR REPLACE FUNCTION cls_user_profiles_update()
RETURNS TRIGGER AS
$$
BEGIN
    -- 若為管理員，允許任何更新
    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    -- 對於非管理員，確保只更新 name、phone、id_card
    IF NEW.email != OLD.email OR NEW.is_in != OLD.is_in OR NEW.point != OLD.point THEN
        RAISE EXCEPTION '只有管理員可以更新 email、is_in 和 point 欄位';
    END IF;

    -- 確保更新操作由用戶本人發起
    IF auth.uid() != OLD.id THEN
        RAISE EXCEPTION '用戶只能更新自己的記錄';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- 在更新前檢查用戶個人資料更新條件
DROP TRIGGER IF EXISTS before_update ON public.user_profiles;
CREATE TRIGGER before_update
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION cls_user_profiles_update();


-- 在新增用戶時自動設置 raw_app_meta_data
CREATE OR REPLACE FUNCTION auth.handle_new_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth 
AS $$
DECLARE
    user_role public.user_role;
    admin_role public.admin_role;
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
    -- 設置 banned
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('banned', false);

    RETURN NEW;
END;
$$;

-- 在新增用戶記錄前執行 raw_app_meta_data 設置
DROP TRIGGER IF EXISTS before_insert_user ON auth.users;
CREATE TRIGGER before_insert_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user_metadata();
  

-- 在用戶註冊時自動新增 user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 插入新的 user_profile 記錄
    INSERT INTO user_profiles (id, email, is_in, point) VALUES (NEW.id, NEW.email, false, 0);

    RETURN NULL;
END;
$$;

-- 在新增用戶記錄後執行 user_profile 記錄的新增
DROP TRIGGER IF EXISTS after_insert_user ON auth.users;
CREATE TRIGGER after_insert_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();





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



/* todo: 
    - trigger判斷是否進入blacklist
    - timmer判斷解禁時間
*/
 