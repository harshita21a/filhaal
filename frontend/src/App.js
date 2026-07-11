import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import PostDetail from "@/pages/PostDetail";
import Suggestions from "@/pages/Suggestions";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import PostEditor from "@/pages/PostEditor";

function Protected({ children }) {
  const { authed } = useAuth();
  if (authed === null) return <div className="min-h-screen flex items-center justify-center bg-cream text-muted-foreground">…</div>;
  if (!authed) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:name" element={<CategoryPage />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Protected><AdminDashboard /></Protected>} />
            <Route path="/admin/new" element={<Protected><PostEditor /></Protected>} />
            <Route path="/admin/edit/:id" element={<Protected><PostEditor /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
