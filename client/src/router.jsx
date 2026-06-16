import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import DirectoryView from "./directoryview";

const Login = lazy(() => import("./components/auth/login"));
const SignUp = lazy(() => import("./components/auth/signup"));
const NotFound = lazy(() => import("./components/NotFound"));

const withSuspense = (Component, props = {}) => (
  <Suspense
    fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }
  >
    <Component {...props} />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DirectoryView />,
  },
  {
    path: "/shared",
    element: <DirectoryView isSharedMode={true} />,
  },
  {
    path: "/starred",
    element: <DirectoryView isStarredMode={true} />,
  },
  {
    path: "/recent",
    element: <DirectoryView isRecentMode={true} />,
  },
  {
    path: "/trash",
    element: <DirectoryView isTrashMode={true} />,
  },
  {
    path: "/search",
    element: <DirectoryView isSearchMode={true} />,
  },
  {
    path: "/directory/:directoryId",
    element: <DirectoryView />,
  },
  {
    path: "/login",
    element: withSuspense(Login),
  },
  {
    path: "/signup",
    element: withSuspense(SignUp),
  },
  {
    path: "*",
    element: withSuspense(NotFound),
  },
]);
