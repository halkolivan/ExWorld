import {
  CircleUserRound,
  MessageCircle,
  Play,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { party } from "@mock/mockData";

const sportCategories = {
  BMX: "Вело",
  Skate: "Скейт",
  Moto: "Мото",
};

export default function NewsFeed() {
  const { t } = useTranslation();
  const { selectedSport } = useOutletContext();
  const selectedCategory = sportCategories[selectedSport];
  const filteredParty = party.filter(
    (item) => item.category === selectedCategory,
  );

  return (
    <main className="min-h-full w-full bg-gray-800 px-4 py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
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
                  {item.name}
                </h2>
                <p className="text-sm text-gray-300">
                  {item.category} · {item.location}
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

            <div
              role="img"
              aria-label={`${t("VideoPlaceholder")}: ${item.category}, ${item.location}`}
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
                {item.category} · {item.location}
              </span>
              <span className="absolute right-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-white/80">
                {t("VideoPlaceholder")}
              </span>
            </div>

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
    </main>
  );
}
