-- Security hardening: messages.media_url must remain an internal storage path.
-- We intentionally do NOT allow absolute URLs in chat rows.
-- Constraints are NOT VALID so existing legacy rows are not blocked,
-- but all new inserts/updates must satisfy these checks.

DO $$
BEGIN
  ALTER TABLE public.messages
    ADD CONSTRAINT chk_messages_media_url_internal
    CHECK (
      media_url IS NULL
      OR media_url !~* '^[a-z][a-z0-9+.-]*://'
    ) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.messages
    ADD CONSTRAINT chk_messages_media_path_scoped
    CHECK (
      media_url IS NULL
      OR split_part(media_url, '/', 1) = conversation_id::text
    ) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
