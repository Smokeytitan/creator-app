-- Temporarily disable RLS for social_connections to work with Clerk
-- TODO: Set up Clerk JWT template for proper Supabase integration
ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
