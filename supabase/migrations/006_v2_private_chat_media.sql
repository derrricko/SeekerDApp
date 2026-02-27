-- Make chat-media bucket private so files are only accessible via signed URLs.
-- RLS policies from 001 still enforce participant-only upload/read.
UPDATE storage.buckets SET public = false WHERE id = 'chat-media';
