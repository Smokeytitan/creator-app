-- Re-enable RLS now that we use backend API endpoints
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

-- Remove old policies
DROP POLICY IF EXISTS "Users can view their own connections" ON social_connections;
DROP POLICY IF EXISTS "Users can manage their own connections" ON social_connections;
DROP POLICY IF EXISTS "Admins can view all connections" ON social_connections;

-- No policies needed - all access goes through backend with service key
