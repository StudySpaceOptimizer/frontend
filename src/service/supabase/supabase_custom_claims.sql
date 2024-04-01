/**
- github: https://github.com/supabase-community/supabase-custom-claims/blob/main/README.md
*/


/**
- 如果會話使用者是 authenticator，則進一步檢查 JWT 中的 claims
- 首先檢查 JWT 是否已過期。 如果 JWT 中的角色是 service_role，則認為使用者有管理員權限
- 如果使用者的 app_metadata 中有 claims_admin 屬性且設定為 true，則認為使用者有管理員權限
- 其他情況下，使用者沒有管理員權限
- example:
    select is_claims_admin();
*/
CREATE OR REPLACE FUNCTION is_claims_admin() RETURNS "bool"
  LANGUAGE "plpgsql" 
  AS $$
  BEGIN
    IF session_user = 'authenticator' THEN
      --------------------------------------------
      -- To disallow any authenticated app users
      -- from editing claims, delete the following
      -- block of code and replace it with:
      -- RETURN FALSE;
      --------------------------------------------
      IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
        return false; -- jwt expired
      END IF;
      If current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
        RETURN true; -- service role users have admin rights
      END IF;
      IF coalesce((current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->'claims_admin', 'false')::bool THEN
        return true; -- user has claims_admin set to true
      ELSE
        return false; -- user does NOT have claims_admin set to true
      END IF;
      --------------------------------------------
      -- End of block 
      --------------------------------------------
    ELSE -- not a user session, probably being called from a trigger or something
      return true;
    END IF;
  END;
$$;


/*
- 傳回目前會話使用者的所有 claims
- 從目前會話的 JWT 中提取 app_metadata 欄位
- example:
    select get_my_claims();
- return:
    {"provider": "email", "userrole": "MANAGER", "providers": ["email"], "userlevel": 100, "useractive": true, "userjoined": "2022-05-20T14:07:27.742Z", "claims_admin": true}
*/
CREATE OR REPLACE FUNCTION get_my_claims() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
$$;


/**
- 回當前會話使用者的特定 claim
- 參數: 
    - claim: 使用者想要查詢的特定 claim 名稱
- example:
    select get_my_claim('userlevel');
*/
CREATE OR REPLACE FUNCTION get_my_claim(claim TEXT) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  	coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim, null)
$$;


/**
- 傳回指定使用者的所有 claims
- 參數: 
    - uid: 目標使用者的 UUID
- 首先檢查執行操作的使用者是否為管理員，如果是，從 auth.users 表中查詢並傳回指定使用者的 raw_app_meta_data 欄位
- 如果不是管理員，回傳錯誤訊息
*/
CREATE OR REPLACE FUNCTION get_claims(uid uuid) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN '{"error":"access denied"}'::jsonb;
      ELSE
        select raw_app_meta_data from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;


/**
- 傳回指定使用者的特定 claim
- 參數:
    - uid: 目標使用者的 UUID
    - claim: 想要查詢的特定 claim 名稱
*/
CREATE OR REPLACE FUNCTION get_claim(uid uuid, claim text) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    DECLARE retval jsonb;
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN '{"error":"access denied"}'::jsonb;
      ELSE
        select coalesce(raw_app_meta_data->claim, null) from auth.users into retval where id = uid::uuid;
        return retval;
      END IF;
    END;
$$;


/**
- 為指定使用者設定一個新的 claim
- 參數:
    - uid: 目標使用者的 UUID
    - claim: 要設定的 claim 名稱
    - value: claim 的值
- 檢查執行操作的使用者是否為管理員，如果是，更新 auth.users 表中指定使用者的 raw_app_meta_data 字段
- 如果不是管理員，回傳錯誤訊息
- example:
    select set_claim('72e699aa-d50c-4ee3-9eb6-e29c169b5eff', 'userrole', '"webadmin"');
    // 注意單引號裡面的雙引號
*/
CREATE OR REPLACE FUNCTION set_claim(uid uuid, claim text, value jsonb) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN 'error: access denied';
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data || 
            json_build_object(claim, value)::jsonb where id = uid;
        return 'OK';
      END IF;
    END;
$$;


/**
- 刪除指定使用者的特定 claim
- 參數:
    - uid: 目標使用者的 UUID
    - claim: 要刪除的 claim 名稱
- 檢查執行操作的使用者是否為管理員，如果是，更新 auth.users 表中指定使用者的 raw_app_meta_data 字段，移除指定的 claim
- 如果不是管理員，回傳錯誤訊息
*/
CREATE OR REPLACE FUNCTION delete_claim(uid uuid, claim text) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      IF NOT is_claims_admin() THEN
          RETURN 'error: access denied';
      ELSE        
        update auth.users set raw_app_meta_data = 
          raw_app_meta_data - claim where id = uid;
        return 'OK';
      END IF;
    END;
$$;
NOTIFY pgrst, 'reload schema';