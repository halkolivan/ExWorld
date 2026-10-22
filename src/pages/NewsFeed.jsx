import {
  CircleUserRound,
  MessageCircle,
  Play,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/context/auth-context-export";
import { party } from "@mock/mockData";
import { supabase } from "@/supabaseClient";

const sportCategories = ["BMX", "Skate", "Moto"];

function getYouTubeEmbedUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    let videoId;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
    ) {
      videoId =
        url.searchParams.get("v") ||
        url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function getNickname(email) {
  return email?.split("@")[0] || "";
}

export default function NewsFeed() {
  const { t } = useTranslation();
  const { selectedSport, setSelectedSport } = useOutletContext();
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdContent, setCreatedContent] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [postsError, setPostsError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
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
      const { data, error } = await supabase
        .from("posts")
        .select("id, user_id, author_name, title, video_url, category")
        // .eq("user_id", String(user.id))
        .order("created_at", { ascending: false });

      if (!isCurrentUser) return;

      if (error) {
        console.error("Failed to load posts from Supabase:", error);
        setPostsError(t("PostsLoadError"));
        return;
      }

      setPostsError("");
      setCreatedContent(
        data.map((post) => ({
          id: post.id,
          userId: post.user_id,
          name: post.author_name,
          title: post.title,
          videoUrl: post.video_url,
          category: post.category,
          likes: 0,
          dislikes: 0,
          comments: 0,
          duels: 0,
          tricks: 1,
        })),
      );
    }

    loadPosts();

    return () => {
      isCurrentUser = false;
    };
  }, [user?.id, t]);

  async function publishContent(event) {
    event.preventDefault();
    if (isPublishing) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get("trickTitle").trim();
    const videoUrl = formData.get("videoUrl").trim();
    const category = formData.get("category");
    const errors = {};

    if (!title) errors.trickTitle = t("RequiredField");
    if (!videoUrl) {
      errors.videoUrl = t("RequiredField");
    } else {
      try {
        const url = new URL(videoUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.videoUrl = t("InvalidVideoUrl");
        }
      } catch {
        errors.videoUrl = t("InvalidVideoUrl");
      }
    }
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

    setIsPublishing(true);
    setPostsError("");

    const authorName =
      getNickname(user.email) || user.name || t("UnknownAuthor");
    let data;

    try {
      // 🚀 Сохраняем в таблицу `posts` в Supabase
      const result = await supabase
        .from("posts")
        .insert({
          user_id: String(user.id), // Берем ID из вашей авторизации
          author_name: authorName, // Имя пользователя
          title: title, // Заголовок
          video_url: videoUrl, // Ссылка на видео (соответствует колонке в базе)
          category: category, // Категория (BMX, Skate, Moto)
        })
        .select("id, user_id, author_name, title, video_url, category")
        .single();

      if (result.error) throw result.error;
      data = result.data;
    } catch (error) {
      console.error("Failed to save post to Supabase:", error);
      setPostsError(t("PostsSaveError"));
      return;
    } finally {
      setIsPublishing(false);
    }

    // Добавляем новый пост в локальный стейт, чтобы он сразу появился на экране
    setCreatedContent((content) => [
      {
        id: data.id,
        userId: data.user_id,
        name: data.author_name,
        title: data.title,
        videoUrl: data.video_url,
        category: data.category,
        likes: 0,
        dislikes: 0,
        comments: 0,
        duels: 0,
        tricks: 1,
      },
      ...content,
    ]);
    setSelectedSport(category);
    setIsAddModalOpen(false);
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
              setIsAddModalOpen(true);
            }}
            className="flex size-10 !p-0 items-center justify-center rounded-lg !bg-green-600/30 !text-white transition-colors hover:!bg-fuchsia-500"
          >
            <Plus aria-hidden="true" className="size-6 shrink-0" strokeWidth={2.5} />
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
            key={item.id}
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
              <div className="flex shrink-0 gap-3 text-right text-xs text-gray-300 sm:gap-5 sm:text-sm">
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
            </header>

            {item.title && (
              <h3 className="px-4 pb-3 font-medium text-white">{item.title}</h3>
            )}

            {item.videoUrl ? (
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
                ) : /\.(?:mp4|webm|ogg)$/i.test(new URL(item.videoUrl).pathname) ? (
                  <video
                    controls
                    className="h-full w-full"
                    src={item.videoUrl}
                  >
                    {t("VideoUnsupported")}
                  </video>
                ) : (
                  <a
                    href={item.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full items-center justify-center gap-2 text-white hover:text-fuchsia-300"
                  >
                    <Play aria-hidden="true" className="size-7" />
                    {t("OpenVideo")}
                  </a>
                )}
              </div>
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
                <ThumbsUp aria-hidden="true" className="h-4 w-4" />
                <span>{item.likes}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown aria-hidden="true" className="h-4 w-4" />
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
            aria-labelledby="add-content-title"
            className="w-full max-w-lg rounded-xl border border-gray-600 bg-gray-800 p-5 text-white shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="add-content-title" className="text-xl font-semibold">
                {t("AddTrickTitle")}
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
                  aria-invalid={Boolean(formErrors.trickTitle)}
                  aria-describedby={
                    formErrors.trickTitle ? "trick-title-error" : undefined
                  }
                  className="w-full rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
                />
                {formErrors.trickTitle && (
                  <p id="trick-title-error" className="mt-1 text-sm text-red-300">
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
                  type="url"
                  required
                  aria-invalid={Boolean(formErrors.videoUrl)}
                  aria-describedby={
                    formErrors.videoUrl ? "video-url-error" : undefined
                  }
                  className="w-full rounded-lg border border-gray-500 bg-gray-900 px-3 py-2 text-white outline-none focus:border-fuchsia-400"
                />
                {formErrors.videoUrl && (
                  <p id="video-url-error" className="mt-1 text-sm text-red-300">
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
                  defaultValue=""
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
                  {isPublishing ? t("Publishing") : t("Publish")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
