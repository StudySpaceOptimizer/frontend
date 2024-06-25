-- 創建黑名單表，如果不存在
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 為黑名單表的結束時間創建索引，以提高查詢效率
CREATE INDEX IF NOT EXISTS idx_blacklist_end_at ON blacklist (end_at);

-- 創建一個視圖，以篩選出當前有效的黑名單記錄
CREATE OR REPLACE VIEW active_blacklist
WITH (security_invoker = on) AS
SELECT *
FROM public.blacklist
WHERE end_at > NOW();

-- ==========================
-- RLS
-- ==========================

-- 啟用RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 為管理員角色創建全權訪問策略，允許執行所有操作
DROP POLICY IF EXISTS admin_all_access ON blacklist;
CREATE POLICY admin_all_access ON blacklist AS PERMISSIVE
FOR ALL
USING (is_claims_admin ())
WITH CHECK (is_claims_admin ());

-- 為普通用戶創建查詢自己黑名單記錄的策略
DROP POLICY IF EXISTS user_select_own ON blacklist;
CREATE POLICY user_select_own ON blacklist AS PERMISSIVE
FOR SELECT
USING (auth.uid() = user_id);

-- 創建一個函數來檢查用戶是否不在黑名單中
CREATE OR REPLACE FUNCTION is_not_banned() RETURNS BOOLEAN AS $$
DECLARE
    is_banned BOOLEAN;
BEGIN
    IF session_user = 'authenticator' THEN
        -- 判斷 JWT 是否過期
        IF extract(epoch from now()) > coalesce((current_setting('request.jwt.claims', true)::jsonb)->>'exp', '0')::numeric THEN
            RETURN false; -- JWT 已過期
        END IF;

        -- 判斷當前角色是否為服務角色
        IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
            RETURN true;
        END IF;

        -- 檢查該用戶是否目前在黑名單中
        SELECT NOT EXISTS (
            SELECT 1 FROM active_blacklist
            WHERE auth.uid() = user_id
        ) INTO is_banned;

        RETURN is_banned;

    ELSE -- 如果不是用戶會話，可能是被觸發器等內部過程調用
        RETURN true;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
