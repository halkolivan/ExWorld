import {
  CircleUserRound,
  MoreVertical,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/auth-context-export";
import { party } from "@mock/mockData";
import { isSupabaseConfigured, supabase } from "@/supabaseClient";

const sportCategories = ["BMX", "Skate", "Moto"];

function getYouTubeEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    const host = url.hostname.replace(/^www\./, "");
    let videoId;

    if (host === "youtu.be") {
      videoId = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1];
    } else if (
      ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
    ) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        videoId = url.pathname.match(
          /^\/(?:embed|shorts|live)\/([\w-]{11})\/?$/,
        )?.[1];
      }
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function isVideoContentUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return false;
    }

    return (
      Boolean(getYouTubeEmbedUrl(videoUrl)) ||
      /\.(?:mp4|webm|ogg)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function getNickname(email) {
  return email?.split("@")[0] || "";
}

function isPostOwner(post, user) {
  if (!post?.userId || !user?.id) return false;
  const postUserId = String(post?.userId);
  return (
    postUserId === String(user?.id) ||
    (user?.googleId && postUserId === String(user.googleId))
  );
}

export default function NewsFeed() {
  const { t } = useTranslation();
  const { selectedSport, setSelectedSport } = useOutletContext();
  const { user } = useAuth();
  const currentVoteUserId = String(user?.googleId || user?.id || "");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [openPostMenuId, setOpenPostMenuId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [createdContent, setCreatedContent] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [postsError, setPostsError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [votingPostId, setVotingPostId] = useState(null);
  const filteredParty = [...createdContent, ...party].filter(
    (item) => item.category === selectedSport,
  );

  useEffect(() => {
    if (!user?.id) {
      setCreatedContent([]);
      return undefined;
    }

    let isCurrentUser = true;
    setCreatedContent([]);
    setPostsError("");

    async function loadPosts() {
      if (!isSupabaseConfigured) {
        setPostsError(t("SupabaseConfigError"));
        return;
      }

      try {
        const { data: posts, error: postsQueryError } = await supabase
          .from("posts")
          .select("id, user_id, author_name, title, video_url, category")
          .order("id", { ascending: false });

        if (postsQueryError) throw postsQueryError;

        if (!isCurrentUser) return;

        const loadedPosts = posts.map((post) => ({
          id: post.id,
          userId: post.user_id,
          name: post.author_name,
          title: post.title,
          videoUrl: post.video_url,
          category: post.category,
          isPersisted: true,
          likes: 0,
          dislikes: 0,
          userVote: null,
          comments: 0,
          duels: 0,
          tricks: 1,
        }));
        setCreatedContent(loadedPosts);
        setPostsError("");

        const postIds = posts.map((post) => String(post.id));
        if (postIds.length === 0) return;

        try {
          const { data: voteRows, error: votesQueryError } = await supabase
            .from("post_votes")
            .select("post_id, user_id, vote")
            .in("post_id", postIds);

          if (votesQueryError) throw votesQueryError;

          if (!isCurrentUser) return;

          const voteSummary = new Map();
          for (const vote of voteRows) {
            const postSummary = voteSummary.get(vote.post_id) ?? {
              likes: 0,
              dislikes: 0,
              userVote: null,
            };
            if (vote.vote === 1) postSummary.likes += 1;
            if (vote.vote === -1) postSummary.dislikes += 1;
            if (String(vote.user_id) === currentVoteUserId) {
              postSummary.userVote = vote.vote;
            }
            voteSummary.set(vote.post_id, postSummary);
          }

          setCreatedContent((currentPosts) =>
            currentPosts.map((post) => ({
              ...post,
              ...(voteSummary.get(String(post.id)) ?? {}),
            })),
          );
        } catch (error) {
          if (!isCurrentUser) return;
          console.error("Failed to load post votes from Supabase:", error);
          setPostsError(t("VotesLoadError"));
        }
      } catch (error) {
        if (!isCurrentUser) return;
        console.error("Failed to load posts from Supabase:", error);
        setPostsError(t("PostsLoadError"));
      }
    }

    loadPosts();

    return () => {
      isCurrentUser = false;
    };
  }, [user?.id, user?.googleId, currentVoteUserId, t]);

  async function publishContent(event) {
    event.preventDefault();
    if (isPublishing) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get("trickTitle").trim();
    const videoUrl = formData.get("videoUrl").trim();
    const category = formData.get("category");
    const errors = {};

    if (!title) errors.trickTitle = t("RequiredField");
    if (!videoUrl) errors.videoUrl = t("RequiredField");
    if (!sportCategories.includes(category)) {
      errors.category = t("RequiredField");
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Проверяем, авторизован ли пользователь через ваш AuthContext
    if (!user?.id) {
      setPostsError(t("PostsSaveError"));
      return;
    }

    if (!isSupabaseConfigured) {
      setPostsError(t("SupabaseConfigError"));
      return;
    }

    setIsPublishing(true);
    setPostsError("");

    let data;
    try {
      if (editingPost) {
        const { data: updatedPost, error } = await supabase
          .from("posts")
          .update({ title, url: videoUrl, video_url: videoUrl, category })
          .eq("id", editingPost.id)
          .eq("user_id", String(editingPost.userId))
          .select("id, user_id, author_name, title, video_url, category")
          .single();

        if (error) throw error;
        data = updatedPost;
      } else {
        const authorName =
          getNickname(user.email) || user.name || t("UnknownAuthor");
        const { data: createdPost, error } = await supabase
          .from("posts")
          .insert({
            user_id: String(user.id),
            author_name: authorName,
            title,
            url: videoUrl,
            video_url: videoUrl,
            category,
          })
          .select("id, user_id, author_name, title, video_url, category")
          .single();

        if (error) throw error;
        data = createdPost;
      }
    } catch (error) {
      console.error(
        `Failed to ${editingPost ? "update" : "save"} post in Supabase:`,
        error,
      );
      setPostsError(t(editingPost ? "PostsUpdateError" : "PostsSaveError"));
      return;
    } finally {
      setIsPublishing(false);
    }

    const previousPost = editingPost
      ? createdContent.find((post) => post.id === editingPost.id)
      : null;
    const savedPost = {
      id: data.id,
      userId: data.user_id,
      name: data.author_name,
      title: data.title,
      videoUrl: data.video_url,
      category: data.category,
      isPersisted: true,
      likes: previousPost?.likes ?? 0,
      dislikes: previousPost?.dislikes ?? 0,
      userVote: previousPost?.userVote ?? null,
      comments: 0,
      duels: 0,
      tricks: 1,
    };

    if (editingPost) {
      setCreatedContent((content) =>
        content.map((post) => (post.id === editingPost.id ? savedPost : post)),
      );
    } else {
      setCreatedContent((content) => [savedPost, ...content]);
    }

    setSelectedSport(category);
    setEditingPost(null);
    setIsAddModalOpen(false);
  }

  async function deletePost(post) {
    if (!user?.id || !isSupabaseConfigured) {
      setPostsError(t("PostsDeleteError"));
      return;
    }

    if (!window.confirm(t("PostDeleteConfirm"))) return;

    setPostsError("");
    setDeletingPostId(post.id);
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", String(post.userId))
        .select("id")
        .single();

      if (error) throw error;

      setCreatedContent((content) =>
        content.filter((item) => item.id !== post.id),
      );
      setOpenPostMenuId(null);
    } catch (error) {
      console.error("Failed to delete post from Supabase:", error);
      setPostsError(t("PostsDeleteError"));
    } finally {
      setDeletingPostId(null);
    }
  }

  async function voteOnPost(post, vote) {
    if (!user?.id || !post.isPersisted || votingPostId === post.id) return;
    if (vote === 1 && isPostOwner(post, user)) {
      setPostsError(t("OwnLikeError"));
      return;
    }
    if (!isSupabaseConfigured) {
      setPostsError(t("SupabaseConfigError"));
      return;
    }

    setPostsError("");
    setVotingPostId(post.id);
    const postId = String(post.id);
    const userId = currentVoteUserId;

    try {
      if (post.userVote === vote) {
        const { error } = await supabase
          .from("post_votes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_votes").upsert(
          { post_id: postId, user_id: userId, vote },
          { onConflict: "post_id,user_id" },
        );
        if (error) throw error;
      }

      const { data: votes, error } = await supabase
        .from("post_votes")
        .select("user_id, vote")
        .eq("post_id", postId);
      if (error) throw error;

      const userVote =
        votes.find((entry) => String(entry.user_id) === userId)?.vote ?? null;
      const likes = votes.filter((entry) => entry.vote === 1).length;
      const dislikes = votes.filter((entry) => entry.vote === -1).length;

      setCreatedContent((content) =>
        content.map((item) =>
          item.id === post.id
            ? { ...item, likes, dislikes, userVote }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to save post vote in Supabase:", error);
      setPostsError(t("VoteSaveError"));
    } finally {
      setVotingPostId(null);
    }
  }

  return (
    <main className="min-h-full w-full bg-gray-800 px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="sticky top-[80px] z-40 flex flex-wrap items-center gap-2 rounded-lg border border-gray-600 bg-gray-800/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            aria-label={t("AddContent")}
            onClick={() => {
              setFormErrors({});
              setEditingPost(null);
              setIsAddModalOpen(true);
            }}
            className="flex size-10 !p-0 items-center justify-center rounded-lg !bg-green-600/30 !text-white transition-colors hover:!bg-fuchsia-500"
          >
            <Plus
              aria-hidden="true"
              className="size-6 shrink-0"
              strokeWidth={2.5}
            />
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-700"
          >
            {t("FilterAuthor")}
          </button>
          <button
            type="button"
            className="rounded-lg border border-gray-500 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-gray-700"
          >
            {t("FilterDate")}
          </button>
        </div>
        {postsError && (
          <p role="alert" className="rounded-lg bg-red-900/60 p-3 text-red-100">
            {postsError}
          </p>
        )}
        {filteredParty.map((item) => (
          <article
            key={`${item.userId ?? "mock"}-${item.id}`}
            className="overflow-hidden rounded-lg border border-gray-600 bg-gray-700"
          >
            <header className="flex items-center gap-3 p-4">
              <CircleUserRound
                aria-hidden="true"
                className="h-11 w-11 shrink-0 text-gray-300"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-white">
                  {getNickname(item.email) || item.name}
                </h2>
                <p className="text-sm text-gray-300">
                  {t(item.category)}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>
              <div className="relative flex shrink-0 items-center gap-3">
                <div className="flex gap-3 text-right text-xs text-gray-300 sm:gap-5 sm:text-sm">
                  <p>
                    <span className="block font-semibold text-white">
                      {item.duels}
                    </span>
                    {t("DuelsCount")}
                  </p>
                  <p>
                    <span className="block font-semibold text-white">
                      {item.tricks}
                    </span>
                    {t("Tricks")}
                  </p>
                </div>
                {user?.id && isPostOwner(item, user) && (
                  <div>
                    <button
                      type="button"
                      aria-label={t("PostActions")}
                      aria-haspopup="menu"
                      aria-expanded={openPostMenuId === item.id}
                      onClick={() =>
                        setOpenPostMenuId((openId) =>
                          openId === item.id ? null : item.id,
                        )
                      }
                      className="rounded-full text-gray-300 hover:bg-gray-600 hover:text-white"
                    >
                      <MoreVertical aria-hidden="true" className="size-5" />
                    </button>
                    {openPostMenuId === item.id && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-10 mt-1 min-w-36 overflow-hidden rounded-lg border border-gray-600 bg-gray-800 py-1 text-left shadow-xl"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setEditingPost(item);
                            setFormErrors({});
                            setPostsError("");
                            setIsAddModalOpen(true);
                            setOpenPostMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white hover:bg-gray-700"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                          {t("EditPost")}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={deletingPostId === item.id}
                          onClick={() => deletePost(item)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          {t("DeletePost")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </header>

            {item.title && (
              <h3 className="px-4 pb-3 font-medium text-white">{item.title}</h3>
            )}

            {item.videoUrl && isVideoContentUrl(item.videoUrl) ? (
              <div className="aspect-video bg-black">
                {getYouTubeEmbedUrl(item.videoUrl) ? (
                  <iframe
                    title={item.title || t("VideoTitle")}
                    src={getYouTubeEmbedUrl(item.videoUrl)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <video controls className="h-full w-full" src={item.videoUrl}>
                    {t("VideoUnsupported")}
                  </video>
                )}
              </div>
            ) : item.videoUrl ? (
              <p
                role="alert"
                className="bg-red-900/60 p-3 text-sm text-red-100"
              >
                {t("InvalidVideoUrl")}
              </p>
            ) : (
              <div
                role="img"
                aria-label={`${t("VideoPlaceholder")}: ${t(item.category)}, ${item.location}`}
                className="relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-950"
              >
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_48%,white_49%,transparent_50%)]" />
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm">
                  <Play
                    aria-hidden="true"
                    className="ml-1 h-7 w-7 fill-current"
                  />
                </div>
                <span className="absolute bottom-3 left-3 text-sm text-white/80">
                  {t(item.category)}
                  {item.location ? ` · ${item.location}` : ""}
                </span>
                <span className="absolute right-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white/80">
                  {t("VideoPlaceholder")}
                </span>
              </div>
            )}

            <footer className="flex items-center gap-6 px-4 py-3 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`${t("Like")}: ${item.likes}`}
                  aria-pressed={item.userVote === 1}
                  title={
                    !user?.id
                      ? t("LoginToVote")
                      : isPostOwner(item, user)
                        ? t("OwnLikeError")
                        : undefined
                  }
                  disabled={
                    !user?.id ||
                    !item.isPersisted ||
                    isPostOwner(item, user) ||
                    votingPostId === item.id
                  }
                  onClick={() => voteOnPost(item, 1)}
                  className="rounded transition-colors hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:text-green-400"
                >
                  <ThumbsUp aria-hidden="true" className="h-4 w-4" />
                </button>
                <span>{item.likes}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`${t("Dislike")}: ${item.dislikes}`}
                  aria-pressed={item.userVote === -1}
                  title={!user?.id ? t("LoginToVote") : undefined}
                  disabled={
                    !user?.id || !item.isPersisted || votingPostId === item.id
                  }
                  onClick={() => voteOnPost(item, -1)}
                  className="rounded transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:text-red-400"
                >
                  <ThumbsDown aria-hidden="true" className="h-4 w-4" />
                </button>
                <span>{item.dislikes}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle aria-hidden="true" className="h-4 w-4" />
                <span>{item.comments}</span>
              </div>
            </footer>
          </article>
        ))}
      </div>

      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsAddModalOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsAddModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
            className="w-full max-w-lg rounded-xl border border-gray-600 bg-gray-800 p-5 text-white shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="post-modal-title" className="text-xl font-semibold">
                {t(editingPost ? "EditPostTitle" : "AddTrickTitle")}
              </h2>
              <button
                type="button"
                aria-label={t("Cancel")}
                onClick={() => setIsAddModalOpen(false)}
                className="rounded p-1 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <form
              key={editingPost?.id ?? "new-post"}
              className="flex flex-col gap-4"
              noValidate
              onSubmit={publishContent}
            >
              <div>
                <label
                  htmlFor="trick-title"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("TrickTitle")}
                </label>
                <input
                  id="trick-title"
                  name="trickTitle"
                  type="text"
                  maxLength={50}
                  required
                  autoFocus
                  defaultValue={editingPost?.title ?? ""}
                  aria-invalid={Boolean(formErrors.trickTitle)}
                  aria-describedby={
                    formErrors.trickTitle ? "trick-title-error" : undefined
                  }
                  className="w-full rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
                />
                {formErrors.trickTitle && (
                  <p
                    id="trick-title-error"
                    className="mt-1 text-sm text-red-300"
                  >
                    {formErrors.trickTitle}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="video-url"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("VideoUrl")}
                </label>
                <input
                  id="video-url"
                  name="videoUrl"
                  type="text"
                  required
                  defaultValue={editingPost?.videoUrl ?? ""}
                  inputMode="url"
                  aria-invalid={Boolean(formErrors.videoUrl)}
                  aria-describedby={
                    formErrors.videoUrl ? "video-url-error" : undefined
                  }
                  onBlur={(event) => {
                    setFormErrors((errors) => ({
                      ...errors,
                      videoUrl: event.target.value.trim()
                        ? ""
                        : t("RequiredField"),
                    }));
                  }}
                  onChange={(event) => {
                    if (formErrors.videoUrl && event.target.value.trim()) {
                      setFormErrors((errors) => ({
                        ...errors,
                        videoUrl: "",
                      }));
                    }
                  }}
                  className="w-full rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
                />
                {formErrors.videoUrl && (
                  <p
                    id="video-url-error"
                    role="alert"
                    className="mt-1 text-sm text-red-300"
                  >
                    {formErrors.videoUrl}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="trick-category"
                  className="mb-1 block text-sm font-medium"
                >
                  {t("TrickCategory")}
                </label>
                <select
                  id="trick-category"
                  name="category"
                  required
                  defaultValue={editingPost?.category ?? ""}
                  aria-invalid={Boolean(formErrors.category)}
                  aria-describedby={
                    formErrors.category ? "trick-category-error" : undefined
                  }
                  className="w-full rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
                >
                  <option value="" disabled>
                    {t("SelectCategory")}
                  </option>
                  {sportCategories.map((category) => (
                    <option key={category} value={category}>
                      {t(category)}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p
                    id="trick-category-error"
                    className="mt-1 text-sm text-red-300"
                  >
                    {formErrors.category}
                  </p>
                )}
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-gray-500 px-4 py-2 font-medium text-gray-100 transition-colors hover:bg-gray-700"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="rounded-lg bg-fuchsia-600 px-4 py-2 font-medium text-white transition-colors hover:bg-fuchsia-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {isPublishing
                    ? t(editingPost ? "SavingChanges" : "Publishing")
                    : t(editingPost ? "SaveChanges" : "Publish")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
