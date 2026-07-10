import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api, { CATEGORIES, mediaUrl } from "@/lib/api";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";

const empty = {
  title: "", category: "Songs", excerpt: "", cover_image: "", body: "",
  personal_note: "", embeds: [], featured: false, published: true,
};

const PostEditor = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editing) {
      api.get("/admin/posts").then(({ data }) => {
        const p = data.find((x) => x.id === id);
        if (p) setForm({ ...empty, ...p });
      });
    }
  }, [id, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      set("cover_image", data.url);
      toast.success("Cover uploaded");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
    e.target.value = "";
  };

  const addEmbed = () => set("embeds", [...form.embeds, { type: "link", url: "", label: "" }]);
  const updEmbed = (i, k, v) => set("embeds", form.embeds.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const rmEmbed = (i) => set("embeds", form.embeds.filter((_, idx) => idx !== i));

  const save = async (publish) => {
    if (!form.title.trim()) { toast.error("Add a title"); return; }
    setSaving(true);
    const payload = { ...form, published: publish };
    try {
      if (editing) await api.put(`/admin/posts/${id}`, payload);
      else await api.post("/admin/posts", payload);
      toast.success(publish ? "Published" : "Saved as draft");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-cream" data-testid="post-editor">
      <header className="border-b border-border bg-cream sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground" data-testid="editor-back">
            <ArrowLeft size={14} /> Studio
          </Link>
          <div className="flex items-center gap-2">
            <Button onClick={() => save(false)} disabled={saving} variant="outline" className="rounded-none text-xs uppercase tracking-[0.15em]" data-testid="save-draft-btn">
              Save draft
            </Button>
            <Button onClick={() => save(true)} disabled={saving} className="rounded-none text-xs uppercase tracking-[0.15em]" data-testid="publish-btn">
              {saving ? "…" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 md:px-10 py-12 space-y-8">
        <h1 className="font-serif text-3xl">{editing ? "Edit post" : "New post"}</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.15em]">Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="rounded-none bg-cream h-11" data-testid="category-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} data-testid={`cat-opt-${c}`}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={(v) => set("featured", v)} data-testid="featured-switch" />
              <Label className="text-xs uppercase tracking-[0.15em]">Feature on homepage</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Title</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="An unforgettable headline" className="rounded-none bg-cream h-12 font-serif text-xl" data-testid="title-input" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Excerpt</Label>
          <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="A short, tantalising summary…" className="rounded-none bg-cream" rows={2} data-testid="excerpt-input" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Cover image</Label>
          {form.cover_image ? (
            <div className="relative w-full max-w-md">
              <img src={mediaUrl(form.cover_image)} alt="cover" className="w-full aspect-[4/3] object-cover" data-testid="cover-preview" />
              <button onClick={() => set("cover_image", "")} className="absolute top-2 right-2 bg-charcoal text-cream p-1.5" data-testid="remove-cover"><X size={16} /></button>
            </div>
          ) : (
            <button onClick={() => coverRef.current.click()} disabled={uploading} className="flex items-center gap-2 border border-dashed border-border px-6 py-8 w-full max-w-md justify-center hover:border-accent transition-colors" data-testid="upload-cover-btn">
              <Upload size={18} /> {uploading ? "Uploading…" : "Upload cover image"}
            </button>
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} data-testid="cover-input" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.15em]">Body</Label>
          <RichTextEditor value={form.body} onChange={(v) => set("body", v)} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-[0.15em]">Embedded media / links</Label>
            <Button onClick={addEmbed} variant="ghost" size="sm" className="rounded-none text-xs" data-testid="add-embed-btn"><Plus size={14} className="mr-1" /> Add</Button>
          </div>
          {form.embeds.map((e, i) => (
            <div key={i} className="flex gap-2 items-center" data-testid={`embed-row-${i}`}>
              <Input value={e.label} onChange={(ev) => updEmbed(i, "label", ev.target.value)} placeholder="Label (e.g. Listen on Spotify)" className="rounded-none bg-cream" data-testid={`embed-label-${i}`} />
              <Input value={e.url} onChange={(ev) => updEmbed(i, "url", ev.target.value)} placeholder="https://…" className="rounded-none bg-cream" data-testid={`embed-url-${i}`} />
              <button onClick={() => rmEmbed(i)} className="p-2 text-destructive" data-testid={`remove-embed-${i}`}><X size={16} /></button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.15em]">A personal note</Label>
          <Textarea value={form.personal_note} onChange={(e) => set("personal_note", e.target.value)} placeholder="Something personal, in your own voice…" className="rounded-none bg-cream font-serif italic text-lg" rows={3} data-testid="note-input" />
        </div>
      </main>
    </div>
  );
};

export default PostEditor;
