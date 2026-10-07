import { CircleUserRound, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { duelChallenges, party } from "@mock/mockData";

export default function Duels() {
  const { t } = useTranslation();

  return (
    <main className="min-h-full w-full bg-gray-800 px-4 py-6">
      <div className="flex flex-col gap-2 w-fit mx-auto max-w-3xl sm:grid-cols-2">
        {duelChallenges.map((duel) => {
          const challenger = party.find(
            (user) => user.id === duel.challengerId,
          );
          const opponent = party.find((user) => user.id === duel.opponentId);

          if (!challenger || !opponent) return null;

          return (
            <article
              key={duel.id}
              className="overflow-hidden rounded-lg border border-gray-600 bg-gray-700"
            >
              <header className="flex items-center gap-2 border-b border-gray-600 px-4 py-3 text-gray-100">
                <MapPin
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-emerald-400"
                />
                <h2 className="font-semibold">{duel.location}</h2>
              </header>

              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-6 sm:gap-4">
                {[challenger, opponent].map((user, index) => (
                  <div
                    key={user.id}
                    className={`flex min-w-0 flex-col items-center text-center ${index === 1 ? "col-start-3 row-start-1" : ""}`}
                  >
                    <h3 className="mb-3 w-full truncate font-semibold text-white">
                      {user.name}
                    </h3>
                    <CircleUserRound
                      aria-hidden="true"
                      className="mb-3 h-14 w-14 text-gray-300 sm:h-16 sm:w-16"
                      strokeWidth={1.4}
                    />
                    <div className="flex gap-3 text-xs text-gray-300 sm:gap-4 sm:text-sm">
                      <span>
                        {user.duels} {t("DuelsCount")}
                      </span>
                      <span>
                        {user.tricks} {t("Tricks")}
                      </span>
                    </div>
                  </div>
                ))}
                <span className="col-start-2 row-start-1 text-sm font-black tracking-wider text-emerald-300 sm:text-base">
                  VS
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
