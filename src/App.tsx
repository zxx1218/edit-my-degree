import { Suspense, lazy } from "react";
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
import QueryLogins from "./pages/QueryLogins";
import MessageBoard from "./pages/MessageBoard";
import NotFound from "./pages/NotFound";

const SuperAdd = lazy(() => import("./pages/SuperAdd"));
const StudentStatusDetail = lazy(() => import("./pages/StudentStatusDetail"));
const EducationDetail = lazy(() => import("./pages/EducationDetail"));
const DegreeDetail = lazy(() => import("./pages/DegreeDetail"));
const ExamDetail = lazy(() => import("./pages/ExamDetail"));
const EducationBackground = lazy(() => import("./pages/EducationBackground"));
const VerificationReport = lazy(() => import("./pages/VerificationReport"));
const MaintenanceNotice = lazy(() => import("./pages/MaintenanceNotice"));
const Verification = lazy(() => import("./pages/VerificationEducation"));
const VerificationDegree = lazy(() => import("./pages/VerificationDegree"));
const VerificationStudentStatus = lazy(() => import("./pages/VerificationStudentStatus"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/purchase" element={<Purchase />} />
            <Route path="/video" element={<VideoPlayer />} />
            <Route path="/query-logins" element={<QueryLogins />} />
            <Route path="/message-board" element={<MessageBoard />} />
            <Route path="/verification-education" element={<Suspense fallback={<PageLoader />}><Verification /></Suspense>} />
            <Route path="/verification-degree" element={<Suspense fallback={<PageLoader />}><VerificationDegree /></Suspense>} />
            <Route path="/verification-studentStatus" element={<Suspense fallback={<PageLoader />}><VerificationStudentStatus /></Suspense>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/student-status/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><StudentStatusDetail /></Suspense></ProtectedRoute>} />
            <Route path="/education/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><EducationDetail /></Suspense></ProtectedRoute>} />
            <Route path="/degree/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><DegreeDetail /></Suspense></ProtectedRoute>} />
            <Route path="/exam/:id" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><ExamDetail /></Suspense></ProtectedRoute>} />
            <Route path="/superadd" element={<Suspense fallback={<PageLoader />}><SuperAdd /></Suspense>} />
            <Route path="/educationBackground" element={<Suspense fallback={<PageLoader />}><EducationBackground /></Suspense>} />
            <Route path="/verification-report" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><VerificationReport /></Suspense></ProtectedRoute>} />
            <Route path="/maintenance-notice" element={<ProtectedRoute><Suspense fallback={<PageLoader />}><MaintenanceNotice /></Suspense></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
