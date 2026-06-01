-- ============================================================================
-- Migration: rename "program" → "course" in the IWC Concepts database
--
-- Run ONCE in the Supabase SQL editor (or any PostgreSQL client) at the same
-- time you deploy the renamed application code. The transaction means that if
-- anything fails the database is left unchanged.
--
-- What this does:
--   1. Renames the `programs` table to `courses`.
--   2. Renames the `program_id` column to `course_id` in all six tables that
--      reference it.
--   3. Renames four indexes that contained "program_id" in their names.
--      (lesson_comments_item_idx had no "program" in its name — no rename.)
--   4. Rewrites the JSONB keys `programId` → `courseId` and
--      `programTitle` → `courseTitle` inside existing rows (only touches rows
--      that actually have those keys, so the update is a no-op on already-
--      migrated rows).
--
-- Safe to re-run: IF EXISTS / WHERE data ? 'key' guards make every statement
-- idempotent (a second run is a silent no-op).
-- ============================================================================

BEGIN;

-- ── Tables ────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS programs RENAME TO courses;

-- ── Columns ──────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS enrollments      RENAME COLUMN program_id TO course_id;
ALTER TABLE IF EXISTS content_sections RENAME COLUMN program_id TO course_id;
ALTER TABLE IF EXISTS content_items    RENAME COLUMN program_id TO course_id;
ALTER TABLE IF EXISTS course_progress  RENAME COLUMN program_id TO course_id;
ALTER TABLE IF EXISTS lesson_comments  RENAME COLUMN program_id TO course_id;
ALTER TABLE IF EXISTS email_reminders  RENAME COLUMN program_id TO course_id;

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Original names (from DatabaseSetup.jsx before the rename):
--   enrollments_program_id_idx
--   content_sections_program_id_idx
--   content_items_program_id_idx
--   course_progress_program_user_idx
--   lesson_comments_item_idx  ← no "program" in name; no rename needed
ALTER INDEX IF EXISTS enrollments_program_id_idx      RENAME TO enrollments_course_id_idx;
ALTER INDEX IF EXISTS content_sections_program_id_idx RENAME TO content_sections_course_id_idx;
ALTER INDEX IF EXISTS content_items_program_id_idx    RENAME TO content_items_course_id_idx;
ALTER INDEX IF EXISTS course_progress_program_user_idx RENAME TO course_progress_course_user_idx;

-- ── JSONB key migration ───────────────────────────────────────────────────────
-- Each UPDATE is guarded by WHERE data ? 'programId' so it only touches rows
-- that still carry the old key — safe to run even after partial migration.

-- enrollments: programId → courseId, programTitle → courseTitle
UPDATE enrollments
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

UPDATE enrollments
   SET data = jsonb_set(data - 'programTitle', '{courseTitle}', data->'programTitle')
 WHERE data ? 'programTitle';

-- content_sections: programId → courseId
UPDATE content_sections
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

-- content_items: programId → courseId
UPDATE content_items
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

-- course_progress: programId → courseId
UPDATE course_progress
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

-- lesson_comments: programId → courseId, programTitle → courseTitle
UPDATE lesson_comments
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

UPDATE lesson_comments
   SET data = jsonb_set(data - 'programTitle', '{courseTitle}', data->'programTitle')
 WHERE data ? 'programTitle';

-- email_reminders: programId → courseId, programTitle → courseTitle
UPDATE email_reminders
   SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
 WHERE data ? 'programId';

UPDATE email_reminders
   SET data = jsonb_set(data - 'programTitle', '{courseTitle}', data->'programTitle')
 WHERE data ? 'programTitle';

COMMIT;
