import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { EducationProvider } from "./contexts/EducationContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <EducationProvider>
        <App />
      </EducationProvider>
    </BrowserRouter>
  </StrictMode>
);
