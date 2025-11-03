-- Enable Row-Level Security (RLS) for Connection and Note tables
-- This ensures users can only access their own data

-- Enable RLS on Connection table
ALTER TABLE "public"."Connection" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Note table
ALTER TABLE "public"."Note" ENABLE ROW LEVEL SECURITY;

-- Connection table policies

-- Policy: Users can SELECT only their own connections
CREATE POLICY "Users can view own connections"
  ON "public"."Connection"
  FOR SELECT
  USING (auth.uid() = "ownerId");

-- Policy: Users can INSERT only with their own ownerId
CREATE POLICY "Users can create own connections"
  ON "public"."Connection"
  FOR INSERT
  WITH CHECK (auth.uid() = "ownerId");

-- Policy: Users can UPDATE only their own connections
CREATE POLICY "Users can update own connections"
  ON "public"."Connection"
  FOR UPDATE
  USING (auth.uid() = "ownerId")
  WITH CHECK (auth.uid() = "ownerId");

-- Policy: Users can DELETE only their own connections
CREATE POLICY "Users can delete own connections"
  ON "public"."Connection"
  FOR DELETE
  USING (auth.uid() = "ownerId");

-- Note table policies
-- Notes are accessed through connections, so we need to ensure users can only
-- access notes for their own connections

-- Policy: Users can SELECT notes for their own connections only
CREATE POLICY "Users can view notes for own connections"
  ON "public"."Note"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Connection"
      WHERE "Connection"."id" = "Note"."connectionId"
      AND "Connection"."ownerId" = auth.uid()
    )
  );

-- Policy: Users can INSERT notes only for their own connections
CREATE POLICY "Users can create notes for own connections"
  ON "public"."Note"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Connection"
      WHERE "Connection"."id" = "Note"."connectionId"
      AND "Connection"."ownerId" = auth.uid()
    )
  );

-- Policy: Users can UPDATE notes only for their own connections
CREATE POLICY "Users can update notes for own connections"
  ON "public"."Note"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Connection"
      WHERE "Connection"."id" = "Note"."connectionId"
      AND "Connection"."ownerId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."Connection"
      WHERE "Connection"."id" = "Note"."connectionId"
      AND "Connection"."ownerId" = auth.uid()
    )
  );

-- Policy: Users can DELETE notes only for their own connections
CREATE POLICY "Users can delete notes for own connections"
  ON "public"."Note"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."Connection"
      WHERE "Connection"."id" = "Note"."connectionId"
      AND "Connection"."ownerId" = auth.uid()
    )
  );

-- Verify RLS is enabled
-- You can run these queries to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('Connection', 'Note');
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

