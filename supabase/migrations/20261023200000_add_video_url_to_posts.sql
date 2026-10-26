ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS video_url text;

NOTIFY pgrst, 'reload schema';
