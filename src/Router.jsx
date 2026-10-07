import { lazy } from "react";
import Template from "./Template";
import AuthCallback from "@/pages/AuthCallback";
import ProtectedRoute from "@/context/ProtectedRoute";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

//import pages
const Home = lazy(() => import("./pages/Home"));
const Privacy = lazy(() => import("@pages/Privacy.jsx"))
const Terms = lazy(() => import("./pages/Terms.jsx"))
const Duels = lazy(() => import("./pages/Duels"));
const NewsFeed = lazy(() => import("./pages/NewsFeed"));
export default function Router() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Template />,
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/duels",
          element: (
            <ProtectedRoute>
              <Duels />
            </ProtectedRoute>
          ),
        },
        {
          path: "/newsFeed",
          element: (
            <ProtectedRoute>
              <NewsFeed />
            </ProtectedRoute>
          ),
        },
        {
          path: "/privacy",
          element: <Privacy />,
        },
        {
          path: "/terms",
          element: <Terms />,
        },
      ],
    },
    { path: "/auth/callback", element: <AuthCallback /> },
  ]);
  return <RouterProvider router={router} />;
}
