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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 設置RLS

-- Create a table for blacklist, referencing the users table
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;


-- 在使用者註冊時自動新增user_profile
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
    user_role := 'outsider';
  END IF;

  NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('userrole', user_role);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_user ON auth.users;
CREATE TRIGGER before_insert_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user_metadata();
  
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
