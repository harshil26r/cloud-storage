import { createBrowserRouter, RouterProvider } from "react-router";
import DirectoryView from "./directory-view";
import Login from "./components/login";
import SignUp from "./components/signup";

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
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
