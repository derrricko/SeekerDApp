-- Classroom Needs Demo Seed Data
-- Run after migration 018_classroom_needs.sql is deployed.
-- Creates three needs in different states to support the full demo narrative.
--
-- Usage: psql $DATABASE_URL -f supabase/seed/classroom_needs_demo.sql
-- Or paste into Supabase SQL Editor.

-- 1. Open need — available for funding in the demo
INSERT INTO classroom_needs (
  id, title, description, image_url, price_usdc,
  teacher_first_name, school_name, school_city, school_state,
  teacher_identity_key, status
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '30-Pack Composition Notebooks',
  'My 4th grade class needs composition notebooks for daily journaling. We go through them fast and the school budget ran out in October.',
  NULL,
  24.99,
  'Ms. Rivera',
  'Lincoln Elementary',
  'Muscatine',
  'IA',
  'teacher-rivera-lincoln',
  'open'
) ON CONFLICT (id) DO NOTHING;

-- 2. Purchased need — shows the "in motion" state with admin review complete
INSERT INTO classroom_needs (
  id, title, description, image_url, price_usdc,
  teacher_first_name, school_name, school_city, school_state,
  teacher_identity_key, status,
  funded_by_wallet, funded_by_donation_id
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Classroom Set of Markers (12 boxes)',
  'We use markers every day for reading response and math journals. Half of our sets have dried out and the kids are sharing one marker between three students.',
  NULL,
  31.50,
  'Mr. Thompson',
  'Washington Middle School',
  'Davenport',
  'IA',
  'teacher-thompson-washington',
  'purchased',
  NULL,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- 3. Delivered need with classroom photo — shows the completed emotional loop
INSERT INTO classroom_needs (
  id, title, description, image_url, price_usdc,
  teacher_first_name, school_name, school_city, school_state,
  teacher_identity_key, status,
  funded_by_wallet, funded_by_donation_id
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'Scientific Calculator Set (10-pack)',
  'My 7th grade pre-algebra students need calculators for the state assessment prep. Right now they share one calculator per table of four.',
  NULL,
  42.00,
  'Ms. Chen',
  'Jefferson Academy',
  'Iowa City',
  'IA',
  'teacher-chen-jefferson',
  'classroom_photo_added',
  NULL,
  NULL
) ON CONFLICT (id) DO NOTHING;
