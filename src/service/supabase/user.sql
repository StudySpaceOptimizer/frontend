/**
- 自訂枚舉類型 userrole
- 管理員:
    - admin
    - assistant
- 學生: student
- 校外人士: outsider
*/
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE userrole AS ENUM('student', 'outsider', 'admin', 'assistant');
    END IF;
END
$$;


-- Create a table for users
CREATE TABLE IF NOT EXISTS user_profiles (
  -- 使用者本人可以select，只有管理員能update
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_in BOOLEAN NOT NULL,
    point INTEGER DEFAULT 0 NOT NULL,

    -- 使用者本人可以select、update
    name TEXT,
    phone TEXT,
    id_card TEXT
);
-- 啟用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 設置RLS

-- 允許管理員所有權限
ALTER TABLE user_profiles DROP POLICY IF EXISTS admin_all_access;
CREATE POLICY admin_all_access ON user_profiles
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許使用者本身的存取與更新
ALTER TABLE user_profiles DROP POLICY IF EXISTS user_select_own;
CREATE POLICY user_select_own ON user_profiles
FOR SELECT
USING (auth.uid() = id);

ALTER TABLE user_profiles DROP POLICY IF EXISTS user_update_own;
CREATE POLICY user_update_own ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 允許使用者更新本身的特定屬性
CREATE OR REPLACE FUNCTION cls_user_profiles_update()
RETURNS TRIGGER AS
$$
BEGIN
    -- 如果是管理员，允许任何更新
    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    -- 对于非管理员用户，确保只更新 name、phone、id_card
    -- 检查是否尝试更新其他字段
    IF NEW.email != OLD.email OR NEW.is_in != OLD.is_in OR NEW.point != OLD.point THEN
        RAISE EXCEPTION '只有管理员可以更新 email、is_in 和 point 字段。';
    END IF;

    -- 检查更新操作是否由用户本人发起
    IF auth.uid() != OLD.id THEN
        RAISE EXCEPTION '用户只能更新自己的记录。';
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_update ON public.user_profiles;
CREATE TRIGGER before_update
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION cls_user_profiles_update();


-- Create a table for blacklist
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL
);
-- 啟用RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 設置RLS

-- 允許管理員所有權限
ALTER TABLE blacklist DROP POLICY IF EXISTS admin_all_access;
CREATE POLICY admin_all_access ON blacklist
FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許使用者本身的存取
ALTER TABLE blacklist DROP POLICY IF EXISTS user_select_own;
CREATE POLICY user_select_own ON blacklist
FOR SELECT
USING (auth.uid() = user_id);


-- 在 auth.users 表上创建新用户时自动设置 raw_app_meta_data
CREATE OR REPLACE FUNCTION auth.handle_new_user_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth 
AS $$
DECLARE
    user_role public.userrole;
BEGIN
    -- 检查email后缀决定role
    IF NEW.email LIKE '%@mail.ntou.edu.tw' THEN
        -- 學生
        user_role := 'student';
    ELSE
        -- 校外人士
        user_role := 'outsider';
    END IF;

    -- 更新 raw_app_meta_data
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('userrole', user_role);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_user ON auth.users;
CREATE TRIGGER before_insert_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user_metadata();
  

-- 在使用者註冊時自動新增user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_profiles (id, email, is_in, point) VALUES (NEW.id, NEW.email, false, 0);

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS after_insert_user ON auth.users;
CREATE TRIGGER after_insert_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();
