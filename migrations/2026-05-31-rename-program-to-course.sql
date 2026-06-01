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
--      `programTitle` → `courseTitle` inside existing rows for the four tables
--      that store a `data` JSONB column: enrollments, content_sections,
--      content_items, lesson_comments. (course_progress and email_reminders
--      use only flat columns — no JSONB to rewrite.)
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
-- Each block is wrapped in a DO $$ check so it silently skips any table that
-- doesn't exist yet. Safe to re-run: the WHERE clause is a no-op once migrated.

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    UPDATE enrollments
       SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
     WHERE data ? 'programId';
    UPDATE enrollments
       SET data = jsonb_set(data - 'programTitle', '{courseTitle}', data->'programTitle')
     WHERE data ? 'programTitle';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_sections') THEN
    UPDATE content_sections
       SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
     WHERE data ? 'programId';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'content_items') THEN
    UPDATE content_items
       SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
     WHERE data ? 'programId';
  END IF;
END $$;

-- course_progress: flat columns only (user_email, course_id, completed_at) — no JSONB to migrate.

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lesson_comments') THEN
    UPDATE lesson_comments
       SET data = jsonb_set(data - 'programId', '{courseId}', data->'programId')
     WHERE data ? 'programId';
    UPDATE lesson_comments
       SET data = jsonb_set(data - 'programTitle', '{courseTitle}', data->'programTitle')
     WHERE data ? 'programTitle';
  END IF;
END $$;

-- email_reminders: flat columns only (user_email, course_id, last_sent) — no JSONB to migrate.

COMMIT;
