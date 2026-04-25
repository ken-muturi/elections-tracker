-- Cascade delete StreamCandidateVote and LevelCandidateVote when a Candidate is deleted.
-- Previously these FKs had no onDelete rule (RESTRICT by default), which prevented
-- deleting a candidate that already had vote rows attached.

-- stream_candidate_votes
ALTER TABLE "stream_candidate_votes"
  DROP CONSTRAINT IF EXISTS "stream_candidate_votes_candidate_id_fkey";

ALTER TABLE "stream_candidate_votes"
  ADD CONSTRAINT "stream_candidate_votes_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- level_candidate_votes
ALTER TABLE "level_candidate_votes"
  DROP CONSTRAINT IF EXISTS "level_candidate_votes_candidate_id_fkey";

ALTER TABLE "level_candidate_votes"
  ADD CONSTRAINT "level_candidate_votes_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
