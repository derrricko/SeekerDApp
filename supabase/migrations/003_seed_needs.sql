-- ============================================================================
-- 003_seed_needs.sql
-- Seed the initial 5 verified needs for Glimpse launch
-- ============================================================================

INSERT INTO needs (slug, title, description, amount, funded, status, partner, icon)
VALUES
  (
    'shower',
    'A clean shower and fresh clothes',
    E'For someone living on the street, a hot shower and clean clothes aren\u2019t just hygiene\u2014they\u2019re dignity. The feeling of being human again. Walking into a room without the weight of shame.',
    25,
    0,
    'active',
    'BeHeard Movement · Tulsa, OK',
    'shower'
  ),
  (
    'groceries',
    'Groceries for a single mom',
    E'She skips meals so her kids don\u2019t have to. Your gift fills a fridge, quiets the worry at 2am, and lets a mom sit at the table with her family instead of staring at an empty one.',
    100,
    0,
    'active',
    NULL,
    'basket-shopping'
  ),
  (
    'wardrobe',
    'New wardrobe for a foster kid',
    E'When a child enters foster care, everything they own fits in a trash bag\u2014if they have anything at all. New clothes that are theirs say something no words can: you matter, and someone thought of you.',
    250,
    0,
    'active',
    NULL,
    'shirt'
  ),
  (
    'tires',
    'New tires for a family in need',
    E'She white-knuckles the steering wheel every morning, praying the bald tires hold\u2014to get her kids to school, herself to work, and everyone home safe. New tires mean she can stop holding her breath.',
    400,
    0,
    'active',
    NULL,
    'car'
  ),
  (
    'rent',
    E'Full month\u2019s rent for a family',
    E'An eviction notice doesn\u2019t just mean losing a home\u2014it means a child wondering where they\u2019ll sleep tomorrow. One month\u2019s rent buys a family the one thing money can\u2019t usually buy: time to breathe.',
    1000,
    0,
    'active',
    NULL,
    'house'
  )
ON CONFLICT (slug) DO NOTHING;
