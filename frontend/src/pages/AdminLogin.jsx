import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { password });
      login(data.token);
      navigate("/admin");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6" data-testid="admin-login-page">
      <div className="w-full max-w-sm">
        <p className="font-serif italic text-5xl text-center mb-2">filhaal</p>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-10">Editor access</p>
        <form onSubmit={submit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-none bg-transparent h-12"
            data-testid="login-password-input"
            autoFocus
          />
          {error && <p className="text-sm text-destructive" data-testid="login-error">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full rounded-none h-12 uppercase tracking-[0.15em] text-xs" data-testid="login-submit">
            {loading ? "…" : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
