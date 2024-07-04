-- 創建校外人士註冊申請表
CREATE TABLE IF NOT EXISTS outsider_sign_up_request (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_card TEXT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

/* ==========================
 * RLS
 * ==========================
 */

-- 啟用 RLS
ALTER TABLE outsider_sign_up_request ENABLE ROW LEVEL SECURITY;

-- 設置管理員的全權訪問策略
DROP POLICY IF EXISTS admin_all_access ON outsider_sign_up_request;
CREATE POLICY admin_all_access ON outsider_sign_up_request AS PERMISSIVE FOR ALL
USING (is_claims_admin())
WITH CHECK (is_claims_admin());

-- 允許任何人新增資料
DROP POLICY IF EXISTS allow_insert_on_outsider_sign_up_request ON outsider_sign_up_request;
CREATE POLICY allow_insert_on_outsider_sign_up_request ON outsider_sign_up_request FOR INSERT
WITH CHECK (true);

/* ==========================
 * TRIGGER
 * ==========================
 */

-- 檢查是否有重複的資料在 user_profiles 中
CREATE OR REPLACE FUNCTION check_duplicates_in_user_profiles()
RETURNS TRIGGER AS $$
DECLARE
  existing_email TEXT;
  existing_phone TEXT;
  existing_id_card TEXT;
BEGIN
  -- 檢查電子郵件唯一性
  SELECT email INTO existing_email FROM user_profiles WHERE email = NEW.email;
  IF existing_email IS NOT NULL THEN
    RAISE EXCEPTION '{"code":"D0001"}';
  END IF;

  -- 檢查電話號碼唯一性
  SELECT phone INTO existing_phone FROM user_profiles WHERE phone = NEW.phone;
  IF existing_phone IS NOT NULL THEN
    RAISE EXCEPTION '{"code":"D0001"}';
  END IF;

  -- 檢查身份證號碼唯一性
  SELECT id_card INTO existing_id_card FROM user_profiles WHERE id_card = NEW.id_card;
  IF existing_id_card IS NOT NULL THEN
    RAISE EXCEPTION '{"code":"D0001"}';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 當插入資料時檢查是否有重複的資料在 user_profiles 中
DROP TRIGGER IF EXISTS trigger_check_duplicates ON outsider_sign_up_request;

CREATE TRIGGER trigger_check_duplicates
BEFORE INSERT ON outsider_sign_up_request
FOR EACH ROW
EXECUTE FUNCTION check_duplicates_in_user_profiles();


/* ==========================
 * UTILS FUNCTION
 * ==========================
 */

/*
檢查插入 user_profiles 表中的資料是否唯一

- 參數:
    - _email: 待檢查的電子郵件地址
    - _phone: 待檢查的電話號碼
    - _id_card: 待檢查的身份證號碼
    
- 異常:
    - 如果電子郵件已存在，則引發 '電子郵件已存在' 異常。
    - 如果電話號碼已存在，則引發 '電話號碼已存在' 異常。
    - 如果身份證號碼已存在，則引發 '身份證號碼已存在' 異常。
*/
CREATE OR REPLACE FUNCTION check_insert_user_profile(
  _email TEXT,
  _phone TEXT,
  _id_card TEXT
) RETURNS VOID AS $$
DECLARE
  existing_email TEXT;
  existing_phone TEXT;
  existing_id_card TEXT;
BEGIN
  -- 檢查電子郵件唯一性
  SELECT email INTO existing_email FROM user_profiles WHERE email = _email;
  IF existing_email IS NOT NULL THEN
    RAISE EXCEPTION '{"code":"D0001"}';
  END IF;

  -- 檢查電話號碼唯一性
  IF _phone IS NOT NULL THEN
    SELECT phone INTO existing_phone FROM user_profiles WHERE phone = _phone;
    IF existing_phone IS NOT NULL THEN
      RAISE EXCEPTION '{"code":"D0001"}';
    END IF;
  END IF;

  -- 檢查身份證號碼唯一性
  IF _id_card IS NOT NULL THEN
    SELECT id_card INTO existing_id_card FROM user_profiles WHERE id_card = _id_card;
    IF existing_id_card IS NOT NULL THEN
      RAISE EXCEPTION '{"code":"D0001"}';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

/*
取得外部註冊請求數據，允許根據多個過濾條件進行資料篩選，並支持分頁功能，以便於管理和顯示大量數據

- 參數:
    - page_size: 每頁的大小，默認為 10，用於控制每頁顯示的數據量
    - page_offset: 頁面偏移量，默認為 0，用於分頁技術中跳過特定數量的記錄
    - filter_email: 電子郵件過濾條件，若指定，則只返回該電子郵件的數據
    - filter_name: 名稱過濾條件，支持模糊匹配，若指定，則返回包含特定文字的名稱
    - filter_phone: 電話號碼過濾條件，若指定，則只返回該電話號碼的數據
    - filter_id_card: 身份證號碼過濾條件，若指定，則只返回該身份證號碼的數據

- 返回值:
    - id: 註冊請求的唯一識別碼
    - email: 電子郵件地址
    - name: 名稱
    - phone: 電話號碼
    - id_card: 身份證號碼
    - inserted_at: 插入時間
 */
CREATE OR REPLACE FUNCTION get_outsider_sign_up_data (
    page_size INT DEFAULT 10,
    page_offset INT DEFAULT 0,
    filter_email TEXT DEFAULT NULL,
    filter_name TEXT DEFAULT NULL,
    filter_phone TEXT DEFAULT NULL,
    filter_id_card TEXT DEFAULT NULL
) RETURNS TABLE (
    email TEXT,
    name TEXT,
    phone TEXT,
    id_card TEXT,
    inserted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    os.email,
    os.name,
    os.phone,
    os.id_card,
    os.inserted_at
  FROM
    outsider_sign_up_request os
  WHERE
    (filter_email IS NULL OR os.email ILIKE '%' || filter_email || '%') AND
    (filter_name IS NULL OR os.name ILIKE '%' || filter_name || '%') AND
    (filter_phone IS NULL OR os.phone ILIKE '%' || filter_phone || '%') AND
    (filter_id_card IS NULL OR os.id_card ILIKE '%' || filter_id_card || '%')
  ORDER BY os.id  -- 添加排序以確保結果一致
  LIMIT page_size OFFSET page_offset;

END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
