import { useEffect } from "react";
import { useAuth } from "@/context/auth-context-export";

export default function ProtectedRoute({ children }) {
  const { user, authLoading, setIsAuthModalOpen } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) setIsAuthModalOpen(true);
  }, [authLoading, user, setIsAuthModalOpen]);

  if (authLoading) return null;
  if (!user) return null;

  return children;
}
