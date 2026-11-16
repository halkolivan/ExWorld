// src/pages/AuthCallback.jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth-context-export";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) navigate("/", { replace: true });
  }, [authLoading, navigate]);

  return <p>{t("SignInWithGoogle")}...</p>;
}
