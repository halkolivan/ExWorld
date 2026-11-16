import { useState, useEffect, useCallback, useRef } from "react";
import { notifySubscriptions } from "@/hooks/useNotifyDataSub";
import { AuthContext } from "./auth-context-export.js";
import { isSupabaseConfigured, supabase } from "@/supabaseClient";

// --- Константы ENV ---
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// 🔑 Функция для получения уникального ключа подписок
const getUserSubscriptionKey = (userId) => {
  return userId ? `userSubscriptions_${userId}` : null;
};

const getAppUser = (authUser) => {
  if (!authUser) return null;

  const googleIdentity = authUser.identities?.find(
    (identity) => identity.provider === "google",
  );
  const metadata = authUser.user_metadata || {};

  return {
    id: authUser.id,
    googleId:
      googleIdentity?.identity_data?.sub ||
      googleIdentity?.identity_data?.provider_id ||
      metadata.provider_id ||
      metadata.sub ||
      googleIdentity?.id ||
      null,
    name:
      metadata.full_name ||
      metadata.name ||
      authUser.email?.split("@")[0] ||
      "",
    email: authUser.email,
    picture: metadata.avatar_url || metadata.picture || "",
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [token, setToken] = useState(
    () => localStorage.getItem("authToken") || null
  );

  const [subscriptions, setSubscriptions] = useState([]);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("userSettings");
    return saved ? JSON.parse(saved) : { currency: { main: "USD" } };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  const tokenClientRef = useRef(null);

  const loadSubscriptions = useCallback((userData) => {
    const userSubKey = getUserSubscriptionKey(
      userData?.googleId || userData?.id,
    );
    if (!userSubKey) {
      setSubscriptions([]);
      return;
    }

    const saved = localStorage.getItem(userSubKey);
    if (!saved) {
      setSubscriptions([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setSubscriptions(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Error parsing local subscriptions:", error);
      setSubscriptions([]);
    }
  }, []);

  const logout = async () => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setToken(null);
    localStorage.removeItem("authToken");
    if (tokenClientRef.current && window.google?.accounts?.oauth2?.revoke) {
      window.google.accounts.oauth2.revoke(token, () =>
        console.log("Google токен отозван.")
      );
    }
  };

  // --- Add Subscription ---
  const addSubscription = (newSubscriptionData) => {
    const subscriptionToAdd = {
      ...newSubscriptionData,
      id: Date.now(),
      currency: newSubscriptionData.currency || "USD",
      nextPayment:
        newSubscriptionData.nextPayment ||
        new Date().toISOString().split("T")[0],
    };

    setSubscriptions((prevSubs) => {
      const updatedSubscriptions = [...prevSubs, subscriptionToAdd];

      const userSubscriptionKey = getUserSubscriptionKey(
        user?.googleId || user?.id,
      );

      if (userSubscriptionKey) {
        localStorage.setItem(
          userSubscriptionKey,
          JSON.stringify(updatedSubscriptions) // Используем АКТУАЛЬНЫЙ массив
        );
      }
      console.log("🆕 Добавлена подписка:", subscriptionToAdd);
      return updatedSubscriptions;
    });
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let isMounted = true;
    const applySession = (session, event) => {
      const appUser = getAppUser(session?.user);
      setUser(appUser);
      loadSubscriptions(appUser);
      setAuthLoading(false);
      if (event === "SIGNED_IN") {
        setJustLoggedIn(true);
        setIsAuthModalOpen(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) applySession(session, event);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("Failed to restore Supabase session:", error);
        setAuthLoading(false);
        return;
      }
      applySession(data.session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadSubscriptions]);

  useEffect(() => {
    if (!window.google?.accounts?.oauth2 || !GOOGLE_CLIENT_ID) return;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      callback: (resp) => {
        if (resp?.access_token) {
          console.log("🔄 Автоматически обновлён Google access_token (Авто)");
          setToken(resp.access_token);
          localStorage.setItem("authToken", resp.access_token);
        }
      },
    });

    const interval = setInterval(() => {
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken({ prompt: "" });
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ АСИНХРОННАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ТОКЕНА
  const refreshAccessToken = useCallback(() => {
    if (!tokenClientRef.current) {
      console.error("Google Token Client не инициализирован.");
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      tokenClientRef.current.requestAccessToken({
        prompt: "",
        callback: (resp) => {
          if (resp?.access_token) {
            console.log("🔄 Обновлён Google access_token (Принудительно)");
            setToken(resp.access_token);
            localStorage.setItem("authToken", resp.access_token);
            resolve(resp.access_token);
          } else {
            console.error("❌ Не удалось обновить токен:", resp);
            resolve(null);
          }
        },
      });
    });
  }, [setToken]);

  // --- Настройки ---
  const updateSettings = (patch) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        ...patch,
        notif: { ...(prev.notif || {}), ...(patch.notif || {}) },
        currency: { ...(prev.currency || {}), ...(patch.currency || {}) },
      };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      return newSettings;
    });
  };

  // --- Уведомления после логина ---
  useEffect(() => {
    if (justLoggedIn) {
      notifySubscriptions(subscriptions);
      setJustLoggedIn(false);
    }
  }, [justLoggedIn, subscriptions]);

  // --- Возврат контекста ---
  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        token,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAddModalOpen,
        setIsAddModalOpen,
        addSubscription,
        subscriptions,
        setSubscriptions,
        settings,
        updateSettings,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
