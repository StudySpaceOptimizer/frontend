/*
 * github: https://github.com/supabase-community/supabase-custom-claims/blob/main/README.md
 */

/*
檢查使用者是是管理員
	- 如果會話使用者是 authenticator，則進一步檢查 JWT 中的 claims
	- 首先檢查 JWT 是否已過期
	- 如果 JWT 中的角色是 service_role，則認為使用者有管理員權限
	- 如果使用者的 app_metadata 中的 claims_admin 屬性為 true，則認為使用者有管理員權限
	- 其他情況下，使用者沒有管理員權限

example:
	SELECT is_claims_admin();
 */
CREATE OR REPLACE FUNCTION is_claims_admin () RETURNS BOOLEAN AS $$
BEGIN
	IF current_user = 'supabase_admin' THEN
		RETURN TRUE;
	END IF;

	IF session_user = 'authenticator' THEN
		-- 判斷 JWT 是否過期
		IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
			RETURN false; -- JWT 已過期
		END IF;

		-- 判斷 service_role
		IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
			RETURN true; -- service_role 角色具有管理員權限
		END IF;

		-- 判斷 userrole 是否為 admin 或 assistant
		IF (current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->>'admin_role' IN ('admin', 'assistant') THEN
			RETURN true; -- 使用者具有 admin 或 assistant 角色
		END IF;

		RETURN false;
	ELSE -- 不是用戶會話，可能是由觸發器或其他方式調用
		return true;
	END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
傳回目前會話使用者的所有 claims:
	- 從目前會話的 JWT 中提取 app_metadata 欄位

Example:
	SELECT get_my_claims();
 */
CREATE OR REPLACE FUNCTION get_my_claims () RETURNS jsonb AS $$
BEGIN
	RETURN (
		SELECT
			coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata', '{}'::jsonb)::jsonb
	);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

/*
傳回當前會話使用者的特定 claim:
	- 參數: 
		- claim: 使用者想要查詢的特定 claim 名稱

Example:
	SELECT get_my_claim('userlevel');
 */
CREATE OR REPLACE FUNCTION get_my_claim (claim TEXT) RETURNS jsonb AS $$
BEGIN
	RETURN (
		SELECT
			coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim, null)
	);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

/*
傳回指定使用者的所有 claims:
	- 參數: 
		- uid: 目標使用者的 UUID

	- 首先檢查執行操作的使用者是否為管理員，如果是，從 auth.users 表中查詢並傳回指定使用者的 raw_app_meta_data 欄位
	- 如果不是管理員，回傳錯誤訊息
 */
CREATE OR REPLACE FUNCTION get_claims (uid UUID) RETURNS jsonb AS $$
DECLARE retval jsonb;
BEGIN
	IF NOT is_claims_admin() THEN
		RETURN '{"error":"不具有管理員權限"}'::jsonb;
	ELSE
		SELECT raw_app_meta_data INTO retval FROM auth.users WHERE id = uid::uuid;
		RETURN retval;
	END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
傳回指定使用者的特定 claim:
	- 參數:
		- uid: 目標使用者的 UUID
		- claim: 想要查詢的特定 claim 名稱
 */
CREATE OR REPLACE FUNCTION get_claim (uid UUID, claim TEXT) RETURNS jsonb AS $$
DECLARE retval jsonb;
BEGIN
	IF NOT is_claims_admin() THEN
		RETURN '{"error":"不具有管理員權限"}'::jsonb;
	ELSE
		SELECT coalesce(raw_app_meta_data->claim, null) INTO retval FROM auth.users WHERE id = uid::uuid;
		RETURN retval;
	END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
為指定使用者設定一個新的 claim：
	- 參數:
		- uid: 目標使用者的 UUID
		- claim: 要設定的 claim 名稱
		- value: claim 的值
	- 檢查執行操作的使用者是否為管理員，如果是，更新 auth.users 表中指定使用者的 raw_app_meta_data 欄位
	- 如果不是管理員，回傳錯誤訊息

Example:
	SELECT set_claim('72e699aa-d50c-4ee3-9eb6-e29c169b5eff', 'userrole', '"webadmin"');

	-- 注意單引號裡面的雙引號
	SELECT set_claim('72e699aa-d50c-4ee3-9eb6-e29c169b5eff', 'claims_admin', 'true');
 */
CREATE OR REPLACE FUNCTION set_claim (uid UUID, claim TEXT, value jsonb) RETURNS TEXT AS $$
BEGIN
	IF NOT is_claims_admin() THEN
		RAISE EXCEPTION '{"code":"U0001"}';
	ELSE        
		UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || json_build_object(claim, value)::jsonb WHERE id = uid;
		RETURN 'OK';
	END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
刪除指定使用者的特定 claim：
	- 參數:
		- uid: 目標使用者的 UUID
		- claim: 要刪除的 claim 名稱
	- 檢查執行操作的使用者是否為管理員，如果是，更新 auth.users 表中指定使用者的 raw_app_meta_data 欄位，移除指定的 claim
	- 如果不是管理員，回傳錯誤訊息
 */
CREATE OR REPLACE FUNCTION delete_claim (uid UUID, claim TEXT) RETURNS TEXT AS $$
BEGIN
	IF NOT is_claims_admin() THEN
		RAISE EXCEPTION '{"code":"U0001"}';
	ELSE        
		UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data - claim WHERE id = uid;
		RETURN 'OK';
	END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
檢查是否為 supabase UI 或 service key
 */
CREATE OR REPLACE FUNCTION is_supabase_ui_or_service_key () RETURNS BOOLEAN AS $$
BEGIN
	IF current_user = 'supabase_admin' THEN
		RETURN TRUE;
	END IF;
	
	IF session_user = 'authenticator' THEN
		IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
		RETURN true; -- service role 使用者具有管理員權限
		END IF;
	END IF;

	RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 通知 pg_rest 重新加載模式
NOTIFY pgrst, 'reload schema';