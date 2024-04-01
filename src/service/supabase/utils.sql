CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role role;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = user_id;
  RETURN user_role IN ('admin', 'assistant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
