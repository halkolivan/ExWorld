import { useState } from "react";
import {
  Lock,
  Settings,
  FileText,
  CirclePlus,
  LogIn,
  Globe,
  User,
  Home,
  Rss,
  Swords,
  Trophy,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SaveButton from "@/components/SaveButton";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/auth-context-export";
import { party } from "@mock/mockData";

// const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

export default function Header() {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [openTop, setOpenTop] = useState(false);

  const topUsers = [...party]
    .sort((firstUser, secondUser) => {
      const firstScore = firstUser.likes / (firstUser.dislikes + 1);
      const secondScore = secondUser.likes / (secondUser.dislikes + 1);

      return secondScore - firstScore;
    })
    .slice(0, 3);

  const {
    user,
    login,
    logout,
    // setIsAuthModalOpen,
    // isAddModalOpen,
    // setIsAddModalOpen,
    // addSubscription,
  } = useAuth();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    localStorage.setItem("i18nextLng", lng);
    i18n.changeLanguage(lng);
  };

  // Google Login с полными правами для Drive
  // Header.jsx
  const loginWithGoogle = useGoogleLogin({
    scope: "email profile openid https://www.googleapis.com/auth/drive.file",
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        ).then((res) => res.json());

        // ✅ ИСПРАВЛЕНО: Добавлен обязательный уникальный ID
        login(
          {
            // 🔑 КЛЮЧЕВОЙ МОМЕНТ: Используем ID для уникального сохранения
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
          },
          tokenResponse.access_token,
        );
        setIsModalOpen(false);
      } catch (err) {
        console.error("Ошибка при получении данных Google:", err);
      }
    },
    onError: () => console.log("Login Failed"),
  });

  return (
    <header className="flex justify-center w-auto sticky top-3 z-50">
      <nav className="flex flex-col sm:flex-row justify-between w-full min-h-[50px] items-center gap-3 p-4 bg-gray-700 rounded-lg">
        {/* Мои подписки — отключаем, если нет user */}
        <div className="flex w-full items-center justify-between gap-3 sm:ml-[50px]">
          <NavLink
            to={user ? "/mysubscriptions" : "#"}
            className={"hidden lg:flex "}
          >
            {({ isActive }) => (
              <h5
                className={
                  user
                    ? (isActive ? "text-blue-600" : "text-gray-300") +
                      " font-bold shadow-md shadow-sky-300 hover:shadow-green-400 p-3 rounded-lg whitespace-nowrap"
                    : " text-gray-500 cursor-not-allowed font-bold"
                }
                onClick={(e) => {
                  if (!user) e.preventDefault(); // блокируем переход
                }}
              >
                <Home />
              </h5>
            )}
          </NavLink>

          <NavLink
            to={user ? "/mysubscriptions" : "#"}
            className="flex lg:hidden"
          >
            {({ isActive }) => (
              <FileText
                size={33}
                className={
                  user
                    ? isActive
                      ? "text-blue-700/90 cursor-pointer"
                      : "text-gray-900 cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }
                onClick={(e) => {
                  if (!user) e.preventDefault(); // блокируем переход
                }}
              />
            )}
          </NavLink>

          {/* Настройки — отключаем, если нет user */}
          <NavLink to={user ? "/settings" : "#"} className={"hidden lg:flex "}>
            {({ isActive }) => (
              <h5
                className={
                  user
                    ? (isActive ? "text-blue-600" : "text-gray-300") +
                      " font-bold shadow-md shadow-sky-300 hover:shadow-green-400 p-3 rounded-lg whitespace-nowrap"
                    : " text-gray-500 cursor-not-allowed font-bold"
                }
                onClick={(e) => {
                  if (!user) e.preventDefault(); // блокируем переход
                }}
              >
                <Rss />
              </h5>
            )}
          </NavLink>

          <NavLink to={user ? "/settings" : "#"} className={"hidden lg:flex "}>
            {({ isActive }) => (
              <h5
                className={
                  user
                    ? (isActive ? "text-blue-600" : "text-gray-300") +
                      " font-bold shadow-md shadow-sky-300 hover:shadow-green-400 p-3 rounded-lg whitespace-nowrap"
                    : " text-gray-500 cursor-not-allowed font-bold"
                }
                onClick={(e) => {
                  if (!user) e.preventDefault(); // блокируем переход
                }}
              >
                <Swords />
              </h5>
            )}
          </NavLink>

          <NavLink
            to={user ? "/settings" : "#"}
            className="flex lg:hidden whitespace-nowrap "
          >
            {({ isActive }) => (
              <Settings
                size={33}
                className={
                  user
                    ? isActive
                      ? "text-blue-700/90 cursor-pointer"
                      : "text-gray-900 cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }
                onClick={(e) => {
                  if (!user) e.preventDefault(); // блокируем переход
                }}
              />
            )}
          </NavLink>

          {/* 🔒 Кнопка приватности */}
          {/* <button
            onClick={() => setShowPrivacy(true)}
            className="flex min-h-[48px] items-center text-gray-700 hover:!text-gray-900 !font-bold hidden lg:flex hover:shadow-green-400 hover:!border-red-200/0
            shadow-md shadow-sky-300 active:shadow-green-600 rounded-lg !bg-gray-50/0 "
          >
            <Lock className="!bg-gray-50/0" />
            {t("Privacy")}
          </button> */}

          <div className="relative flex w-auto items-center justify-center">
            <div
              className="text-[28px] bg-fuchsia-600 
             active:shadow-green-600 rounded-2xl px-3 cursor-pointer"
              onClick={(event) => {
                event.preventDefault();
                setOpenTop((isOpen) => !isOpen);
              }}
              role="button"
              aria-expanded={openTop}
              aria-controls="top-users-menu"
            >
              <span className="text-white">Ex</span>
              <span className="text-black ">Free</span>
            </div>

            <div
              id="top-users-menu"
              aria-hidden={!openTop}
              className={`absolute left-1/2 top-full z-50 mt-2 w-[min(300px,calc(100vw-2rem))] -translate-x-1/2 origin-top rounded-xl bg-gray-800 p-3 text-gray-100 shadow-xl transition-all duration-300 ${
                openTop
                  ? "translate-y-0 scale-y-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-y-0 opacity-0"
              }`}
            >
              <div className="mb-2 flex items-center gap-2 border-b border-gray-600 pb-2 text-sm font-bold">
                <Trophy size={18} className="text-yellow-400" />
                <span>Top 3 users</span>
              </div>
              <ol className="space-y-2">
                {topUsers.map((topUser, index) => (
                  <li
                    key={topUser.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-gray-700 px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-4 text-sm font-bold text-yellow-400">
                        {index + 1}
                      </span>
                      <span className="truncate font-semibold">
                        {topUser.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-gray-300">
                      {topUser.tricks} tricks / {topUser.likes} likes
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <Lock
            size={33}
            className="text-gray-800 flex lg:hidden cursor-pointer"
            onClick={() => setShowPrivacy(true)}
          />

          {/* Sign In / Sign Out */}
          {user ? (
            <div className="flex flex-nowrap shadow-md shadow-sky-300 hover:shadow-green-400 p-3 rounded-lg">
              {/* <h5
                className="cursor-pointer text-gray-800 hover:text-gray-900 font-semibold hidden lg:flex whitespace-nowrap"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                {t("SignOut")} ({user.name})
              </h5> */}
              <User
                size={23}
                className="text-yellow-700 cursor-pointer hover:text-yellow-600 transition-transform duration-150 hover:scale-110"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              />
            </div>
          ) : (
            <>
              <h5
                className="cursor-pointer hover:text-yellow-600 font-semibold text-yellow-800 hidden lg:flex shadow-md shadow-sky-300 hover:shadow-green-400 p-3 rounded-lg"
                onClick={() => setIsModalOpen(true)}
              >
                {t("SignIn")}
              </h5>
              <LogIn
                size={33}
                className="flex lg:hidden text-gray-800"
                onClick={() => setIsModalOpen(true)}
              />
            </>
          )}

          {/* Переключатель языков */}
          <div className=" items-center hidden lg:flex min-h-[48px]">
            <select
              value={i18n.language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="min-h-[48px] border rounded px-2 py-1 text-sm !bg-gray-700 shadow-md shadow-sky-300 text-gray-300 !font-bold
              hover:border-blue-50/0 border-blue-50/0 hover:shadow-green-400 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="ro">Română</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="it">Italiano</option>
              <option value="es">Español</option>
              <option value="nl">Nederlands</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div className="flex lg:hidden relative">
            <Globe
              size={33}
              className="text-gray-800 cursor-pointer active:text-blue-700/70"
              onClick={() => setShowLangMenu(!showLangMenu)}
            />

            {/* Выпадающее меню под иконкой */}
            {showLangMenu && (
              <div className="absolute top-8 right-0 bg-gray-200 rounded shadow-md p-2">
                <select
                  value={i18n.language}
                  onChange={(e) => {
                    changeLanguage(e.target.value);
                    setShowLangMenu(false); // закрываем после выбора
                  }}
                  className="border rounded px-2 py-1 text-sm bg-gray-300 text-gray-700 hover:border-blue-400"
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="ro">Română</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                  <option value="it">Italiano</option>
                  <option value="es">Español</option>
                  <option value="nl">Nederlands</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Модалка приватности */}
        {showPrivacy && (
          <div className="fixed flex items-center justify-center bg-black/50 inset-0 !z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-gray-700 !z-50 bg-gradient-to-t from-gray-800 via-gray-500 to-gray-800">
              <h2 className="text-lg font-semibold mb-3 text-gray-300">
                {t("Privacy")}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                <li>{t("PrivacyLocal")}</li>
                <li>{t("PrivacyNoServer")}</li>
                <li>{t("PrivacyGDPR")}</li>
              </ul>
              <button
                onClick={() => setShowPrivacy(false)}
                className="mt-4 px-4 py-2 text-white rounded !bg-gray-800 hover:!bg-gray-700"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Модальное окно авторизации */}
      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 ">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-[400px] bg-gradient-to-t from-gray-800 via-gray-500 to-gray-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 !text-black hover:!text-red-500 !bg-white/0 hover:!border-white/0"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4">{t("SignIn")}</h2>
            {/* <p className="text-gray-600 mb-4">{t("ChooseAuthMethod")}</p> */}

            {/* Google Auth */}
            <button
              onClick={() => loginWithGoogle()}
              className="w-full px-4 py-2 !bg-gray-800 hover:!bg-gray-700 text-white rounded-sm mt-3 border !border-gray-400"
            >
              {t("SignInWithGoogle")}
            </button>

            {/* GitHub Auth */}
            {/* <button
              onClick={() => {
                const redirectUri = `${window.location.origin}/auth/callback`;
                const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user&redirect_uri=${encodeURIComponent(
                  redirectUri
                )}`;
                setIsModalOpen(false);
                window.location.href = url;
              }}
              className="w-full px-4 py-2 !bg-gray-800 hover:!bg-gray-700 text-white !rounded-sm mt-3 border-1 !border-gray-400"
            >
              {t("SignInWithGitHub")}
            </button> */}
          </div>
        </div>
      )}
    </header>
  );
}
