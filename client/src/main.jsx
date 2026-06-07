import { StrictMode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UIProvider } from "./contexts/UIContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <ThemeProvider>
        <UIProvider>
          <StrictMode>
            <App />
          </StrictMode>
        </UIProvider>
      </ThemeProvider>
    </AuthProvider>
  </GoogleOAuthProvider>,
);
