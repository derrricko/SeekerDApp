-- Classroom Needs — Full Demo Seed (Threads, Donations, Proof Events)
-- Run AFTER classroom_needs_demo.sql and migration 018.
--
-- ⚠️  BEFORE RUNNING: Find-and-replace DEMO_DONOR_WALLET with the
-- presenter's actual Solana wallet address (base58).
--
-- Terminal:
--   sed 's/DEMO_DONOR_WALLET/YourWalletBase58Here/g' \
--     supabase/seed/classroom_needs_demo_threads.sql | psql $DATABASE_URL
--
-- Supabase SQL Editor:
--   Ctrl+H → replace DEMO_DONOR_WALLET → paste your wallet → Run
--
-- SAFE TO RE-RUN: All rows use deterministic IDs with ON CONFLICT DO UPDATE
-- for wallet-bearing columns, so correcting the presenter wallet and
-- re-running will repair all rows in place.

-- ============================================================
-- State A — Open Need (notebooks, $24.99)
-- No additional records. classroom_needs_demo.sql handles this.
-- ============================================================


-- ============================================================
-- State B — Purchased Need: Markers ($31.50)
-- ============================================================

-- B.1 Donation
INSERT INTO donations (
  id, tx_signature, donor_wallet, recipient_wallet, recipient_id,
  amount_usdc, cadence, donation_mode, cause_preferences,
  status, classroom_need_id, created_at
) VALUES (
  'd1000001-0001-4000-a000-000000000001',
  'DEMO-TX-PURCHASED-b2c3d4e5f6a78901bcdef12345678901-0001',
  'DEMO_DONOR_WALLET',
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
  'classroom-needs',
  31.50,
  'one_time',
  'solo',
  '["education","public-schools"]'::jsonb,
  'confirmed',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (id) DO UPDATE SET donor_wallet = EXCLUDED.donor_wallet;

-- B.2 Link funder to need
UPDATE classroom_needs
SET funded_by_wallet      = 'DEMO_DONOR_WALLET',
    funded_by_donation_id = 'd1000001-0001-4000-a000-000000000001'
WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- B.3 Conversation
INSERT INTO conversations (
  id, donation_id, donor_wallet, admin_wallet, created_at
) VALUES (
  'e1000001-0001-4000-b000-000000000001',
  'd1000001-0001-4000-a000-000000000001',
  'DEMO_DONOR_WALLET',
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
  NOW() - INTERVAL '3 days'
) ON CONFLICT (donation_id) DO UPDATE SET donor_wallet = EXCLUDED.donor_wallet;

-- B.4 Proof message timeline (deterministic IDs — safe to re-run)
INSERT INTO messages (id, conversation_id, sender_wallet, body, created_at) VALUES
  -- Welcome
  ('aa000001-0001-4000-d000-000000000001',
   'e1000001-0001-4000-b000-000000000001',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   'Thank you for funding classroom markers for Mr. Thompson''s class at Washington Middle School! We''ll keep you updated as we review and purchase this item.',
   NOW() - INTERVAL '3 days'),
  -- FUNDED
  ('aa000001-0001-4000-d000-000000000002',
   'e1000001-0001-4000-b000-000000000001',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"funded","label":"FUNDED","detail":"Your $31.50 USDC donation is confirmed on-chain. This covers the full cost of Classroom Set of Markers (12 boxes)."}',
   NOW() - INTERVAL '3 days' + INTERVAL '1 minute'),
  -- UNDER REVIEW
  ('aa000001-0001-4000-d000-000000000003',
   'e1000001-0001-4000-b000-000000000001',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"under_review","label":"UNDER REVIEW","detail":"Glimpse is verifying this need and preparing the purchase."}',
   NOW() - INTERVAL '2 days'),
  -- PURCHASED
  ('aa000001-0001-4000-d000-000000000004',
   'e1000001-0001-4000-b000-000000000001',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"purchased","label":"PURCHASED","detail":"Item purchased and shipping to Washington Middle School. Estimated delivery: 3-5 business days."}',
   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- B.5 Purchase order
INSERT INTO purchase_orders (
  id, classroom_need_id, donation_id, amount_usdc,
  status, created_at
) VALUES (
  'f1000001-0001-4000-c000-000000000001',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'd1000001-0001-4000-a000-000000000001',
  31.50,
  'ordered',
  NOW() - INTERVAL '1 day'
) ON CONFLICT (donation_id) DO NOTHING;


-- ============================================================
-- State C — Classroom Photo Added: Calculators ($42.00)
-- ============================================================

-- C.1 Donation
INSERT INTO donations (
  id, tx_signature, donor_wallet, recipient_wallet, recipient_id,
  amount_usdc, cadence, donation_mode, cause_preferences,
  status, classroom_need_id, created_at
) VALUES (
  'd1000001-0001-4000-a000-000000000002',
  'DEMO-TX-COMPLETED-c3d4e5f6a7b89012cdef123456789012-0002',
  'DEMO_DONOR_WALLET',
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
  'classroom-needs',
  42.00,
  'one_time',
  'solo',
  '["education","public-schools"]'::jsonb,
  'completed',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  NOW() - INTERVAL '7 days'
) ON CONFLICT (id) DO UPDATE SET donor_wallet = EXCLUDED.donor_wallet;

-- C.2 Link funder to need
UPDATE classroom_needs
SET funded_by_wallet      = 'DEMO_DONOR_WALLET',
    funded_by_donation_id = 'd1000001-0001-4000-a000-000000000002'
WHERE id = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

-- C.3 Conversation
INSERT INTO conversations (
  id, donation_id, donor_wallet, admin_wallet, created_at
) VALUES (
  'e1000001-0001-4000-b000-000000000002',
  'd1000001-0001-4000-a000-000000000002',
  'DEMO_DONOR_WALLET',
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
  NOW() - INTERVAL '7 days'
) ON CONFLICT (donation_id) DO UPDATE SET donor_wallet = EXCLUDED.donor_wallet;

-- C.4 Complete proof event timeline (deterministic IDs — safe to re-run)
INSERT INTO messages (id, conversation_id, sender_wallet, body, created_at) VALUES
  -- Welcome
  ('aa000001-0002-4000-d000-000000000001',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   'Thank you for funding scientific calculators for Ms. Chen''s class at Jefferson Academy! We''ll keep you updated every step of the way.',
   NOW() - INTERVAL '7 days'),
  -- FUNDED
  ('aa000001-0002-4000-d000-000000000002',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"funded","label":"FUNDED","detail":"Your $42.00 USDC donation is confirmed on-chain. This covers the full cost of Scientific Calculator Set (10-pack)."}',
   NOW() - INTERVAL '7 days' + INTERVAL '1 minute'),
  -- UNDER REVIEW
  ('aa000001-0002-4000-d000-000000000003',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"under_review","label":"UNDER REVIEW","detail":"Glimpse is verifying this need and preparing the purchase."}',
   NOW() - INTERVAL '6 days'),
  -- PURCHASED
  ('aa000001-0002-4000-d000-000000000004',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"purchased","label":"PURCHASED","detail":"Item purchased and shipping to Jefferson Academy. Order confirmed."}',
   NOW() - INTERVAL '5 days'),
  -- DELIVERED
  ('aa000001-0002-4000-d000-000000000005',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"delivered","label":"DELIVERED","detail":"The calculators have arrived at Jefferson Academy and were received by school staff."}',
   NOW() - INTERVAL '3 days'),
  -- CLASSROOM PHOTO
  ('aa000001-0002-4000-d000-000000000006',
   'e1000001-0001-4000-b000-000000000002',
   'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
   '{"kind":"proof_event","event":"classroom_photo_added","label":"CLASSROOM PHOTO","detail":"Ms. Chen sent a photo of her students using the calculators during pre-algebra. The giving loop is complete."}',
   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- C.5 Purchase order (delivered)
INSERT INTO purchase_orders (
  id, classroom_need_id, donation_id, amount_usdc,
  status, created_at
) VALUES (
  'f1000001-0001-4000-c000-000000000002',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'd1000001-0001-4000-a000-000000000002',
  42.00,
  'delivered',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (donation_id) DO NOTHING;


-- ============================================================
-- Verification (uncomment and run to confirm seeded data)
-- ============================================================
-- SELECT cn.title, cn.status, d.amount_usdc, c.id AS conv_id,
--        (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id) AS msg_count
-- FROM classroom_needs cn
-- LEFT JOIN donations d ON d.classroom_need_id = cn.id
-- LEFT JOIN conversations c ON c.donation_id = d.id
-- ORDER BY cn.created_at;
