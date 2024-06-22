CREATE OR REPLACE FUNCTION public.pop3_verify(email text, password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    response jsonb;
BEGIN
    -- 請求外部 POP3 API 進行驗證
    -- SELECT INTO response
    -- net.http_post(
    --     'https://your-pop3-api.com/verify',
    --     json_build_object('email', email, 'password', password),
    --     'Content-Type=application/json'
    -- );

    -- 假設 API 返回 { "status": "success" } 表示驗證成功
    IF email = 'admin@email.com' AND password = 'password' THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    claims jsonb;
    email text;
    password text;
    is_valid boolean;
BEGIN
    email := (event->>'claims'->>'email')::text;
    password := (event->>'claims'->>'password')::text;
    is_valid := pop3_verify(email, password);

    IF NOT is_valid THEN
        RAISE EXCEPTION 'Invalid POP3 login';
    END IF;

    claims := event->'claims';
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

create function public.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
as $$
  declare
    last_failed_at timestamp;
  begin
    if event->'valid' is true then
      -- password is valid, accept it
      return jsonb_build_object('decision', 'continue');
    end if;

    select last_failed_at into last_failed_at
      from public.password_failed_verification_attempts
      where
        user_id = event->'user_id';

    if last_failed_at is not null and now() - last_failed_at < interval '10 seconds' then
      -- last attempt was done too quickly
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 429,
          'message',   'Please wait a moment before trying again.'
        )
      );
    end if;

    -- record this failed attempt
    insert into public.password_failed_verification_attempts
      (
        user_id,
        last_failed_at
      )
      values
      (
        event->'user_id',
        now()
      )
      on conflict do update
        set last_failed_at = now();

    -- finally let Supabase Auth do the default behavior for a failed attempt
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions
grant execute
  on function public.hook_password_verification_attempt
  to supabase_auth_admin;

grant all
  on table public.password_failed_verification_attempts
  to supabase_auth_admin;

revoke execute
  on function public.hook_password_verification_attempt
  from authenticated, anon, public;

revoke all
  on table public.password_failed_verification_attempts
  from authenticated, anon, public;
