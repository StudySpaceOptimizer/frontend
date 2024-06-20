-- 創建黑名單表
CREATE TABLE IF NOT EXISTS
    blacklist (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES user_profiles (id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        end_at TIMESTAMP WITH TIME ZONE NOT NULL
    );

-- 為黑名單結束時間創建索引
CREATE INDEX IF NOT EXISTS idx_blacklist_end_at ON blacklist (end_at);

-- 創建視圖以篩選當前有效的黑名單記錄
CREATE OR REPLACE VIEW
    active_blacklist
WITH
    (security_invoker = on) AS
SELECT
    *
FROM
    public.blacklist
WHERE
    end_at > NOW();

/* ==========================
 * RLS
 * ==========================
 */
-- 啟用 RLS
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- 允許管理員所有權限
DROP POLICY IF EXISTS admin_all_access ON blacklist;

CREATE POLICY admin_all_access ON blacklist AS PERMISSIVE FOR ALL USING (is_claims_admin ())
WITH
    CHECK (is_claims_admin ());

-- 允許用戶查詢自己的黑名單記錄
DROP POLICY IF EXISTS user_select_own ON blacklist;

CREATE POLICY user_select_own ON blacklist AS PERMISSIVE FOR
SELECT
    USING (auth.uid () = user_id);

/* ==========================
 * TIGGER
 * ==========================
 */
/*
 * 檢查使用者是否被ban
 * 如果會話使用者是 authenticator，則進一步檢查 JWT 中的 claims
 * 首先檢查 JWT 是否已過期
 * 如果 JWT 中的角色是 service_role，則回傳 false
 * 如果使用者的 app_metadata 中的 banned 屬性為 true，則回傳 true
 * 其他情況下，回傳 true
 * example:
select is_not_banned();
 */
CREATE
OR REPLACE FUNCTION is_not_banned () RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;