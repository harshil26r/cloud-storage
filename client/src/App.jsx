import { createBrowserRouter, RouterProvider } from "react-router";
import DirectoryView from "./directory-view";

const router = createBrowserRouter([
  {
    path: "/*",
    element: <DirectoryView />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
