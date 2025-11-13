import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Purchase from "./pages/Purchase";
import VideoPlayer from "./pages/VideoPlayer";
import StudentStatusDetail from "./pages/StudentStatusDetail";
import EducationDetail from "./pages/EducationDetail";
import DegreeDetail from "./pages/DegreeDetail";
import ExamDetail from "./pages/ExamDetail";
import SuperAdd from "./pages/SuperAdd";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/video" element={<VideoPlayer />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/student-status/:id" element={<ProtectedRoute><StudentStatusDetail /></ProtectedRoute>} />
            <Route path="/education/:id" element={<ProtectedRoute><EducationDetail /></ProtectedRoute>} />
            <Route path="/degree/:id" element={<ProtectedRoute><DegreeDetail /></ProtectedRoute>} />
            <Route path="/exam/:id" element={<ProtectedRoute><ExamDetail /></ProtectedRoute>} />
            <Route path="/superadd" element={<ProtectedRoute><SuperAdd /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
