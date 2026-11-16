CREATE OR REPLACE FUNCTION public.current_google_provider_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT identities.provider_id
  FROM auth.identities AS identities
  WHERE identities.user_id = auth.uid()
    AND identities.provider = 'google'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_google_provider_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_google_provider_id() TO authenticated;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.posts TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.posts FROM anon;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;

DROP POLICY IF EXISTS "Posts are publicly readable" ON public.posts;
CREATE POLICY "Posts are publicly readable"
  ON public.posts FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create their own posts"
  ON public.posts;
CREATE POLICY "Authenticated users can create their own posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (user_id::text = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Authors can update their posts" ON public.posts;
CREATE POLICY "Authors can update their posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (
    user_id::text = (SELECT auth.uid()::text)
    OR user_id::text = (SELECT public.current_google_provider_id())
  )
  WITH CHECK (
    user_id::text = (SELECT auth.uid()::text)
    OR user_id::text = (SELECT public.current_google_provider_id())
  );

DROP POLICY IF EXISTS "Authors can delete their posts" ON public.posts;
CREATE POLICY "Authors can delete their posts"
  ON public.posts FOR DELETE TO authenticated
  USING (
    user_id::text = (SELECT auth.uid()::text)
    OR user_id::text = (SELECT public.current_google_provider_id())
  );

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.post_votes TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.post_votes FROM anon;
GRANT INSERT, UPDATE, DELETE ON public.post_votes TO authenticated;

DROP POLICY IF EXISTS "Anyone can read post votes" ON public.post_votes;
CREATE POLICY "Anyone can read post votes"
  ON public.post_votes FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Authenticated users can add their own post votes"
  ON public.post_votes;
CREATE POLICY "Authenticated users can add their own post votes"
  ON public.post_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()::text)
    OR user_id = (SELECT public.current_google_provider_id())
  );

DROP POLICY IF EXISTS "Anyone can change post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Authenticated users can change their own post votes"
  ON public.post_votes;
CREATE POLICY "Authenticated users can change their own post votes"
  ON public.post_votes FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text)
    OR user_id = (SELECT public.current_google_provider_id())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()::text)
    OR user_id = (SELECT public.current_google_provider_id())
  );

DROP POLICY IF EXISTS "Anyone can remove post votes" ON public.post_votes;
DROP POLICY IF EXISTS "Authenticated users can remove their own post votes"
  ON public.post_votes;
CREATE POLICY "Authenticated users can remove their own post votes"
  ON public.post_votes FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text)
    OR user_id = (SELECT public.current_google_provider_id())
  );

CREATE OR REPLACE FUNCTION public.validate_post_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  post_author_id text;
BEGIN
  SELECT posts.user_id::text
  INTO post_author_id
  FROM public.posts AS posts
  WHERE posts.id::text = NEW.post_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post does not exist';
  END IF;

  IF NEW.vote = 1 AND (
    post_author_id = NEW.user_id
    OR (
      post_author_id = auth.uid()::text
      AND NEW.user_id = public.current_google_provider_id()
    )
  ) THEN
    RAISE EXCEPTION 'Post authors cannot like their own posts';
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
