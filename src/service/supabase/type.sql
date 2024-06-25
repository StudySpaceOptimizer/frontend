-- 檢查並創建 user_role 枚舉類型
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM('student', 'outsider');
    END IF;
END
$$;

-- 檢查並創建 admin_role 枚舉類型
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE admin_role AS ENUM('admin', 'assistant', 'non-admin');
    END IF;
END
$$;