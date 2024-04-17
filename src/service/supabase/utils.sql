CREATE OR REPLACE FUNCTION get_user_datas()
RETURNS TABLE(
    id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
    is_in BOOLEAN,
    name TEXT,
    phone TEXT,
    id_card TEXT,
    point INT,
    reason TEXT,
    end_at TIMESTAMP WITH TIME ZONE
)
AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        up.email,
        claims ->> 'userrole' as user_role,
        claims ->> 'adminrole' as admin_role,
        up.is_in,
        up.name,
        up.phone,
        up.id_card,
        up.point,
        bl.reason,
        bl.end_at
    FROM
        user_profiles up
    LEFT JOIN
        blacklist bl ON up.id = bl.user_id
    CROSS JOIN LATERAL
        get_claims(up.id) as claims
    WHERE
        is_claims_admin();
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;



CREATE OR REPLACE FUNCTION get_my_user_data()
RETURNS TABLE(
    id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
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
        claims ->> 'userrole' as user_role,
        claims ->> 'adminrole' as admin_role,
        up.is_in,
        up.name,
        up.phone,
        up.id_card,
        up.point,
        bl.reason,
        bl.end_at
    FROM
        user_profiles up
    LEFT JOIN
        blacklist bl ON up.id = bl.user_id
    CROSS JOIN LATERAL
        get_my_claims() as claims
    WHERE
        auth.uid() = up.id;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;


CREATE OR REPLACE FUNCTION get_my_reservations()
RETURNS TABLE(
    -- reservation
    id UUID,
    begin_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    seat_id int8,
    check_in_time timestamp with time zone,
    temporary_leave_time timestamp with time zone,

    -- user_data
    user_id UUID,
    email TEXT,
    user_role TEXT,
    admin_role TEXT,
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
        res.id,
        res.begin_time,
        res.end_time,
        res.seat_id,
        res.check_in_time,
        res.temporary_leave_time,
        user_data.id,
        user_data.email,
        user_data.user_role,
        user_data.admin_role,
        user_data.is_in,
        user_data.name,
        user_data.phone,
        user_data.id_card,
        user_data.point,
        user_data.reason,
        user_data.end_at
    FROM
        Reservations res
    CROSS JOIN LATERAL
        get_my_user_data() as user_data
    WHERE
        auth.uid() = res.user_id;
END;
$$
LANGUAGE plpgsql STABLE
SECURITY INVOKER;