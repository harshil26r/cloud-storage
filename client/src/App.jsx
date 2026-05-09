import { createBrowserRouter, RouterProvider } from "react-router";
import DirectoryView from "./directory-view";
import Login from "./components/login";
import SignUp from "./components/signup";
import NotFound from "./components/NotFound";
import { Toaster } from "react-hot-toast";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DirectoryView />,
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

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
