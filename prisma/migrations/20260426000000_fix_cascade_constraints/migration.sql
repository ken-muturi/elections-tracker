-- Fix FK constraints that were created as RESTRICT but should CASCADE.
-- The schema.prisma already declares onDelete: Cascade for several relations;
-- this migration aligns the live DB constraints to match.

-- streams.polling_station_id (schema: Cascade, DB was: Restrict)
ALTER TABLE "public"."streams"
  DROP CONSTRAINT IF EXISTS "streams_polling_station_id_fkey",
  ADD CONSTRAINT "streams_polling_station_id_fkey"
    FOREIGN KEY ("polling_station_id") REFERENCES "public"."polling_stations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- election_positions.election_id (schema: Cascade, DB was: Restrict)
ALTER TABLE "public"."election_positions"
  DROP CONSTRAINT IF EXISTS "election_positions_election_id_fkey",
  ADD CONSTRAINT "election_positions_election_id_fkey"
    FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- candidates.position_id (schema: Cascade, DB was: Restrict)
ALTER TABLE "public"."candidates"
  DROP CONSTRAINT IF EXISTS "candidates_position_id_fkey",
  ADD CONSTRAINT "candidates_position_id_fkey"
    FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- stream_results.stream_id (no cascade in schema — add it now so stream deletion cleans up)
ALTER TABLE "public"."stream_results"
  DROP CONSTRAINT IF EXISTS "stream_results_stream_id_fkey",
  ADD CONSTRAINT "stream_results_stream_id_fkey"
    FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- stream_results.position_id (cascade when position is removed)
ALTER TABLE "public"."stream_results"
  DROP CONSTRAINT IF EXISTS "stream_results_position_id_fkey",
  ADD CONSTRAINT "stream_results_position_id_fkey"
    FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- agent_streams.election_id (cascade when election is deleted)
ALTER TABLE "public"."agent_streams"
  DROP CONSTRAINT IF EXISTS "agent_streams_election_id_fkey",
  ADD CONSTRAINT "agent_streams_election_id_fkey"
    FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- agent_streams.stream_id (cascade when stream is deleted)
ALTER TABLE "public"."agent_streams"
  DROP CONSTRAINT IF EXISTS "agent_streams_stream_id_fkey",
  ADD CONSTRAINT "agent_streams_stream_id_fkey"
    FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- level_results.position_id (cascade when position is removed)
ALTER TABLE "public"."level_results"
  DROP CONSTRAINT IF EXISTS "level_results_position_id_fkey",
  ADD CONSTRAINT "level_results_position_id_fkey"
    FOREIGN KEY ("position_id") REFERENCES "public"."election_positions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- stream_candidate_votes.candidate_id (was Restrict, should Cascade)
ALTER TABLE "public"."stream_candidate_votes"
  DROP CONSTRAINT IF EXISTS "stream_candidate_votes_candidate_id_fkey",
  ADD CONSTRAINT "stream_candidate_votes_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- level_candidate_votes.candidate_id (was Restrict, should Cascade)
ALTER TABLE "public"."level_candidate_votes"
  DROP CONSTRAINT IF EXISTS "level_candidate_votes_candidate_id_fkey",
  ADD CONSTRAINT "level_candidate_votes_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
