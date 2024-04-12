CREATE OR REPLACE FUNCTION get_user_profiles()
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
        get_claims(up.id) as claims
    WHERE
        is_claims_admin();
END;
$$ LANGUAGE plpgsql STABLE;



CREATE OR REPLACE FUNCTION get_my_profiles()
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
$$ LANGUAGE plpgsql STABLE;
