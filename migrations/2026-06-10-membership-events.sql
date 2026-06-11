-- ── Membership & Events upgrade ────────────────────────────────────────────
-- Run ONCE in your PostgreSQL database (psql, pgAdmin, Supabase SQL Editor…).
-- Safe to re-run (IF NOT EXISTS everywhere). Plain SQL — any PostgreSQL.

-- Members: one row per member email. data JSONB holds plan, status, expiry…
create table if not exists members (
  id         text        primary key,
  email      text        not null unique,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
create index if not exists members_email_idx on members(lower(email));

-- Notifications: event announcements targeted by audience (plans / emails / public)
create table if not exists notifications (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);
