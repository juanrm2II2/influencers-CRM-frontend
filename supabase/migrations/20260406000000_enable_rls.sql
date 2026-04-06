-- ============================================================================
-- Supabase RLS policies for the Influencer CRM
-- Run this migration after enabling Row Level Security on each table.
-- ============================================================================

-- ─── 1. influencers ─────────────────────────────────────────────────────────

ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;

-- Every policy gates access to rows whose user_id matches the JWT's sub claim.

CREATE POLICY "Users can view their own influencers"
  ON influencers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own influencers"
  ON influencers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own influencers"
  ON influencers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own influencers"
  ON influencers FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 2. outreach ───────────────────────────────────────────────────────────

ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

-- Outreach is scoped through the parent influencer's user_id.

CREATE POLICY "Users can view outreach for their own influencers"
  ON outreach FOR SELECT
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert outreach for their own influencers"
  ON outreach FOR INSERT
  WITH CHECK (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update outreach for their own influencers"
  ON outreach FOR UPDATE
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete outreach for their own influencers"
  ON outreach FOR DELETE
  USING (
    influencer_id IN (
      SELECT id FROM influencers WHERE user_id = auth.uid()
    )
  );
