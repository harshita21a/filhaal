import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { CATEGORIES } from "@/lib/api";

export const Header = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/?search=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-border" data-testid="site-header">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="font-serif italic text-3xl md:text-4xl leading-none" data-testid="logo-link">
            filhaal
          </Link>

          <nav className="hidden md:flex items-center gap-8" data-testid="main-nav">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to={`/category/${encodeURIComponent(c)}`}
                className="text-sm uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors link-underline"
                data-testid={`nav-${c.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {c}
              </Link>
            ))}
            <Link
              to="/suggestions"
              className="text-sm uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors link-underline"
              data-testid="nav-suggestions"
            >
              Suggest
            </Link>
          </nav>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="text-foreground hover:text-accent transition-colors"
              aria-label="Search"
              data-testid="search-toggle"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
            <Link
              to="/admin/login"
              className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
              data-testid="admin-link"
            >
              Admin
            </Link>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="pb-5 fade-up" data-testid="search-form">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the diary…"
              className="w-full bg-transparent border-b border-border py-3 text-2xl font-serif italic placeholder:text-muted-foreground/60 focus:outline-none focus:border-accent"
              data-testid="search-input"
            />
          </form>
        )}

        <div className="md:hidden flex items-center gap-5 overflow-x-auto pb-3 -mt-1">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/category/${encodeURIComponent(c)}`}
              className="whitespace-nowrap text-xs uppercase tracking-[0.15em] text-muted-foreground"
              data-testid={`mobile-nav-${c.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};
