CREATE TABLE IF NOT EXISTS public.post_votes (
  post_id text NOT NULL,
  user_id text NOT NULL,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_votes TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read post votes" ON public.post_votes;
CREATE POLICY "Anyone can read post votes"
  ON public.post_votes FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can add post votes" ON public.post_votes;
CREATE POLICY "Anyone can add post votes"
  ON public.post_votes FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can change post votes" ON public.post_votes;
CREATE POLICY "Anyone can change post votes"
  ON public.post_votes FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can remove post votes" ON public.post_votes;
CREATE POLICY "Anyone can remove post votes"
  ON public.post_votes FOR DELETE TO anon, authenticated
  USING (true);

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

  IF NEW.vote = 1 AND post_author_id = NEW.user_id THEN
    RAISE EXCEPTION 'Post authors cannot like their own posts';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_post_vote ON public.post_votes;
CREATE TRIGGER validate_post_vote
  BEFORE INSERT OR UPDATE OF post_id, user_id, vote
  ON public.post_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_post_vote();

CREATE OR REPLACE FUNCTION public.delete_post_votes_for_removed_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM public.post_votes WHERE post_id = OLD.id::text;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS delete_post_votes_after_post_delete ON public.posts;
CREATE TRIGGER delete_post_votes_after_post_delete
  AFTER DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_post_votes_for_removed_post();

NOTIFY pgrst, 'reload schema';
