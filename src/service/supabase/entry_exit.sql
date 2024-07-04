/*
記錄用戶進出場狀態，此函數用於記錄及更新用戶的進場和臨時離場時間
只有管理員可以執行此操作


- 參數:
  - p_user_id: 需要更新進出狀態的用戶的 UUID

流程:
1. 驗證操作者是否為管理員
2. 查詢用戶的當前有效預約
3. 如果沒有預約，則返回錯誤
4. 如果用戶在場，則更新其臨時離場時間，更新用戶的在場狀態
5. 如果用戶不在場，則更新其簽到時間，更新用戶的在場狀態
*/
CREATE OR REPLACE FUNCTION record_user_entry_exit(p_user_id UUID) RETURNS VOID AS $$
DECLARE
    curr_time TIMESTAMP WITH TIME ZONE := current_timestamp; -- 定義當前時間
    reservation RECORD; -- 用於存儲查詢到的預約信息
    user_is_in BOOLEAN; -- 用於存儲用戶當前的在場狀態

BEGIN
    -- 檢查是否為管理員，非管理員則拋出異常
    IF NOT is_claims_admin() THEN
        RAISE EXCEPTION '{"code":"U0001"}';
    END IF;

    -- 查找用戶當前正在進行的有效預約
    SELECT * INTO reservation FROM active_reservations
    WHERE user_id = p_user_id AND begin_time <= curr_time AND end_time > curr_time LIMIT 1;

    -- 如果沒有找到正在進行的預約，發出通知
    IF NOT FOUND THEN
        RAISE NOTICE '該用戶目前沒有正在進行的預約';
        RETURN;
    END IF;

    -- 從用戶檔案中獲取用戶當前是否在場的狀態
    SELECT is_in INTO user_is_in FROM user_profiles WHERE id = p_user_id;

    -- 如果用戶正在場內，則記錄臨時離場時間
    IF user_is_in THEN
        UPDATE reservations SET temporary_leave_time = curr_time WHERE id = reservation.id;
        
        -- 用戶的在場狀態更新為 false
        UPDATE user_profiles SET is_in = fasle WHERE id = p_user_id;
    ELSE
        -- 如果用戶不在場內，則重置臨時離場時間並記錄簽到時間
        UPDATE reservations SET temporary_leave_time = NULL, check_in_time = COALESCE(check_in_time, curr_time)
        WHERE id = reservation.id;

         -- 用戶的在場狀態更新為 true
        UPDATE user_profiles SET is_in = true WHERE id = p_user_id;
    END IF;

END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;

-- 記錄學生進出場狀態
CREATE OR REPLACE FUNCTION record_student_entry_exit(p_account TEXT) RETURNS VOID AS $$
DECLARE
    user_id UUID;
    p_email TEXT := p_account || '@mail.ntou.edu.tw';
BEGIN
    -- 根據 email 查找用戶ID
    SELECT id INTO user_id FROM user_profiles WHERE email = p_email;
    
    -- 如果沒有找到用戶ID，發出通知
    IF NOT FOUND THEN
        RAISE NOTICE '用戶未註冊';
        RETURN;
    END IF;
    
    -- 調用 record_user_entry_exit 函數
    PERFORM record_user_entry_exit(user_id);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;

-- 記錄校外人士進出場狀態
CREATE OR REPLACE FUNCTION record_outsider_entry_exit(p_phone TEXT) RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- 根據 phone 查找用戶ID
    SELECT id INTO user_id FROM user_profiles WHERE phone = p_phone;
    
    -- 如果沒有找到用戶ID，發出通知
    IF NOT FOUND THEN
        RAISE NOTICE '用戶未註冊';
        RETURN;
    END IF;
    
    -- 調用 record_user_entry_exit 函數
    PERFORM record_user_entry_exit(user_id);
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER;
