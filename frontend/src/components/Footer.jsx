import React from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/api";

export const Footer = () => (
  <footer className="border-t border-border mt-24" data-testid="site-footer">
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-16">
      <div className="flex flex-col md:flex-row justify-between gap-10">
        <div className="max-w-sm">
          <p className="font-serif italic text-4xl mb-4">filhaal</p>
          <p className="text-sm font-light text-muted-foreground leading-relaxed">
            A personal diary of the songs, books, websites and small obsessions I'm into — for now.
          </p>
        </div>
        <div className="flex gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Sections</p>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link to={`/category/${encodeURIComponent(c)}`} className="text-sm hover:text-accent transition-colors">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-16">© {new Date().getFullYear()} filhaal — made with intention.</p>
    </div>
  </footer>
);
