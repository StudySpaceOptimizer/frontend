-- 創建用戶個人資料表
CREATE TABLE IF NOT EXISTS user_profiles (
    -- 用戶ID，外鍵參考 auth.users 表的 ID，並在刪除時級聯刪除
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE, -- 電子郵件，唯一且不可為空
    is_in BOOLEAN NOT NULL, -- 表示是否在場內，必須填寫
    point INTEGER DEFAULT 0 NOT NULL, -- 用戶積分，默認為0，必須填寫

    -- 用戶可以選擇填寫和更新的欄位
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

-- 設置管理員的全權訪問策略
DROP POLICY IF EXISTS admin_all_access ON user_profiles;

CREATE POLICY admin_all_access ON user_profiles AS PERMISSIVE FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許用戶存取自己的資料
DROP POLICY IF EXISTS user_select_own ON user_profiles;

CREATE POLICY user_select_own ON user_profiles AS PERMISSIVE FOR SELECT
USING (auth.uid() = id);

-- 允許用戶更新自己的資料
DROP POLICY IF EXISTS user_update_own ON user_profiles;

CREATE POLICY user_update_own ON user_profiles AS PERMISSIVE FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

/* ==========================
 * CLS
 * ==========================
 */
 
-- 限制非管理員的更新範圍
CREATE OR REPLACE FUNCTION cls_user_profiles_update() RETURNS TRIGGER AS $$
BEGIN
    -- 使用 supabase UI 或 service_key 不受限制
    IF is_supabase_ui_or_service_key() THEN
        RETURN NEW;
    END IF;

    -- 若為管理員，允許任何更新
    IF is_claims_admin() THEN
        RETURN NEW;
    END IF;

    -- 對於非管理員，確保只能更新 name、phone、id_card 欄位
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

CREATE TRIGGER trigger_cls_user_profiles_update
BEFORE UPDATE ON user_profiles FOR EACH ROW
EXECUTE FUNCTION cls_user_profiles_update();

/* ==========================
 * TRIGGER
 * ==========================
 */

-- 根據用戶的 email 來設置用戶角色及管理員角色，並儲存於 meta_data
CREATE OR REPLACE FUNCTION set_user_metadata() RETURNS TRIGGER AS $$
DECLARE
    userrole public.user_role;
    adminrole public.admin_role;
    is_verified BOOLEAN;
BEGIN
    -- 根據 email 確定用戶角色(userrole)
    IF NEW.email LIKE '%@mail.ntou.edu.tw' THEN
        -- 學生
        userrole := 'student';
        is_verified := true;
    ELSE
        -- 校外人士
        userrole := 'outsider';
        is_verified := false;
    END IF;

    adminrole := 'non-admin';

    -- 更新 raw_app_meta_data
    -- 設置 user_role
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('user_role', userrole);
    -- 設置 admin_role
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('admin_role', adminrole);
    -- 設置 is_verified
    NEW.raw_app_meta_data := NEW.raw_app_meta_data || jsonb_build_object('is_verified', is_verified);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在新增用戶記錄前執行 raw_app_meta_data 設置
DROP TRIGGER IF EXISTS trigger_set_user_metadata ON auth.users;

CREATE TRIGGER trigger_set_user_metadata
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION set_user_metadata();

-- 在用戶註冊時自動新增 user_profile
CREATE OR REPLACE FUNCTION create_user_profile() RETURNS TRIGGER AS $$
BEGIN
    -- 插入新的 user_profile 記錄
    INSERT INTO public.user_profiles (id, email, is_in, point)
    VALUES (NEW.id, NEW.email, false, 0);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在新增用戶記錄後執行 user_profile 記錄的新增
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;

CREATE TRIGGER trigger_create_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- 處理違規點數到達上限
CREATE OR REPLACE FUNCTION ban_user_on_points_limit() RETURNS TRIGGER AS $$
DECLARE
    points_to_ban_user INT;
BEGIN
    -- 從 settings 表中獲取封禁所需的點數上限
    SELECT value::int INTO points_to_ban_user
    FROM settings
    WHERE key_name = 'points_to_ban_user';

    -- 檢查點數是否大於或等於封禁上限
    IF NEW.point >= points_to_ban_user THEN
        -- 將點數重設為 0
        NEW.point := 0;

        -- 將使用者加入黑名單
        INSERT INTO blacklist (user_id, reason, end_at)
        VALUES (NEW.id, '違規點數達到上限', CURRENT_TIMESTAMP + INTERVAL '30 days');

        -- 更新使用者的點數
        UPDATE user_profiles
        SET point = 0
        WHERE id = NEW.id;
    END IF;

    -- 返回更新後的記錄
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 當 user_profiles 表的 point 欄位被更新時檢查違規點數是否到達上限
DROP TRIGGER IF EXISTS trigger_ban_user_on_points_limit ON user_profiles;

CREATE TRIGGER trigger_ban_user_on_points_limit
AFTER UPDATE OF point ON user_profiles
FOR EACH ROW WHEN (OLD.point <> NEW.point)
EXECUTE FUNCTION ban_user_on_points_limit();

/* ==========================
 * UTILS FUNCTION
 * ==========================
 */
/*
取得所有用戶資訊，但會受到權限限制，例如一般使用者只會返回自己的資料。這個函數允許根據多個過濾條件進行資料篩選，並支持分頁功能，以便於管理和顯示大量用戶數據

- 參數:
    - page_size: 每頁的大小，默認為 10，用於控制每頁顯示的用戶數量
    - page_offset: 頁面偏移量，默認為 0，用於分頁技術中跳過特定數量的記錄
    - filter_user_id: 用戶ID過濾條件，若指定，則只返回該用戶ID的資訊
    - filter_email: 電子郵件過濾條件，若指定，則只返回該電子郵件的用戶資訊
    - filter_user_role: 用戶角色過濾條件，若指定，則只返回該角色的用戶資訊
    - filter_admin_role: 管理員角色過濾條件，若指定，則只返回該管理角色的用戶資訊
    - filter_is_verified: 是否已驗證過濾條件，若指定，則只返回已驗證或未驗證的用戶資訊
    - filter_is_in: 是否在場過濾條件，若指定，則只返回目前在場或不在場的用戶資訊
    - filter_name: 用戶名稱過濾條件，支持模糊匹配，若指定，則返回包含特定文字的用戶名稱

- 返回值:
    - id: 用戶的唯一識別碼(UUID)
    - email: 用戶的電子郵件地址
    - user_role: 用戶的角色
    - admin_role: 用戶的管理角色（若為管理員）
    - is_verified: 用戶是否已經過驗證
    - is_in: 用戶是否目前在場
    - name: 用戶的全名
    - phone: 用戶的電話號碼
    - id_card: 用戶的身份證號碼
    - point: 用戶的積分
    - reason: 若用戶被列入黑名單，則顯示相應的原因
    - end_at: 黑名單的結束時間
 */
CREATE OR REPLACE FUNCTION get_user_data (
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0,
    filter_user_id UUID DEFAULT NULL,
    filter_email TEXT DEFAULT NULL,
    filter_user_role TEXT DEFAULT NULL,
    filter_admin_role TEXT DEFAULT NULL,
    filter_is_verified BOOLEAN DEFAULT NULL,
    filter_is_in BOOLEAN DEFAULT NULL,
    filter_name TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
    is_verified BOOLEAN,
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
    claims ->> 'user_role' AS user_role,
    claims ->> 'admin_role' AS admin_role,
    (claims ->> 'is_verified')::boolean AS is_verified,
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
    get_claims(up.id) AS claims
  WHERE
    (filter_user_id IS NULL OR up.id = filter_user_id) AND
    (filter_email IS NULL OR up.email = filter_email) AND
    (filter_user_role IS NULL OR claims ->> 'user_role' = filter_user_role) AND
    (filter_admin_role IS NULL OR claims ->> 'admin_role' = filter_admin_role) AND
    (filter_is_verified IS NULL OR (claims ->> 'is_verified')::boolean = filter_is_verified) AND
    (filter_is_in IS NULL OR up.is_in = filter_is_in) AND
    (filter_name IS NULL OR up.name ILIKE '%' || filter_name || '%')
  ORDER BY up.id  -- 添加排序以確保結果一致
  LIMIT page_size OFFSET page_offset;

END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;