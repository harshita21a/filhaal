import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const FALLBACK_CATEGORIES = ["Song", "Book", "Website", "Watch", "Other"];

const empty = { category: "Song", title: "", note: "", name: "" };

const Suggestions = () => {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get("/suggestions").then(({ data }) => { setSuggestions(data); setLoading(false); });

  useEffect(() => {
    api.get("/suggestions/categories").then(({ data }) => setCategories(data)).catch(() => {});
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Add what you're suggesting"); return; }
    setSubmitting(true);
    try {
      await api.post("/suggestions", form);
      toast.success("Thanks for the suggestion!");
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="suggestions-page">
      <Header />
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 md:px-10 py-12 md:py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Suggest</p>
        <h1 className="font-serif text-4xl md:text-5xl mb-4">What should I check out?</h1>
        <p className="text-muted-foreground font-light mb-12">
          A song, a book, a website, something to watch — anything you think belongs here. Drop it below.
        </p>

        <form onSubmit={submit} className="space-y-4 mb-16 border border-border p-6" data-testid="suggestion-form">
          <div className="grid md:grid-cols-2 gap-4">
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="rounded-none bg-cream h-11" data-testid="suggestion-category-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name (optional)"
              className="rounded-none bg-cream h-11"
              data-testid="suggestion-name-input"
            />
          </div>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="What are you suggesting?"
            className="rounded-none bg-cream h-11 font-serif text-lg"
            data-testid="suggestion-title-input"
          />
          <Textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="Why should I check it out? (optional)"
            className="rounded-none bg-cream"
            rows={3}
            data-testid="suggestion-note-input"
          />
          <Button type="submit" disabled={submitting} className="rounded-none uppercase tracking-[0.15em] text-xs h-11" data-testid="suggestion-submit-btn">
            {submitting ? "…" : "Send suggestion"}
          </Button>
        </form>

        <div className="border-b border-border pb-4 mb-8">
          <h2 className="font-serif text-2xl">What people have suggested</h2>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-light">Loading…</p>
        ) : suggestions.length === 0 ? (
          <p className="text-muted-foreground font-light py-8">No suggestions yet — be the first.</p>
        ) : (
          <div className="space-y-6" data-testid="suggestions-list">
            {suggestions.map((s) => (
              <div key={s.id} className="border-b border-border pb-6" data-testid={`suggestion-${s.id}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-accent mb-1">{s.category}</p>
                <p className="font-serif text-xl mb-1">{s.title}</p>
                {s.note && <p className="text-sm font-light text-muted-foreground mb-1">{s.note}</p>}
                {s.name && <p className="text-xs text-muted-foreground">— {s.name}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Suggestions;