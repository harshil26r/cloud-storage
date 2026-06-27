import { createBrowserRouter } from "react-router";
import DirectoryView from "./directory-view";
import Login from "./components/auth/login";
import SignUp from "./components/auth/signup";
import NotFound from "./components/NotFound";

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
    path: "/trash",
    element: <DirectoryView isTrashMode={true} />,
  },
  {
    path: "/directory/:directoryId",
    element: <DirectoryView />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
