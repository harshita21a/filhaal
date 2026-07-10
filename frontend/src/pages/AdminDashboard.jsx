import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { mediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye, Star, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const load = () => api.get("/admin/posts").then(({ data }) => { setPosts(data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("Post deleted");
      load();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="min-h-screen bg-cream" data-testid="admin-dashboard">
      <header className="border-b border-border bg-cream sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="font-serif italic text-3xl">filhaal</Link>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground border-l border-border pl-4">Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5" data-testid="view-site-link">
              <Eye size={14} /> View site
            </Link>
            <Button onClick={() => { logout(); navigate("/admin/login"); }} variant="ghost" className="rounded-none text-xs uppercase tracking-[0.15em]" data-testid="logout-btn">
              <LogOut size={14} className="mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-serif text-4xl mb-1">Your posts</h1>
            <p className="text-sm text-muted-foreground">{posts.length} total</p>
          </div>
          <Button onClick={() => navigate("/admin/new")} className="rounded-none uppercase tracking-[0.15em] text-xs h-11" data-testid="new-post-btn">
            <Plus size={16} className="mr-1.5" /> New post
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground py-16">No posts yet. Create your first one.</p>
        ) : (
          <div className="border-t border-border" data-testid="admin-posts-list">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-5 py-5 border-b border-border group" data-testid={`admin-post-${p.id}`}>
                <div className="w-20 h-16 bg-muted overflow-hidden shrink-0">
                  {p.cover_image && <img src={mediaUrl(p.cover_image)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-accent">{p.category}</span>
                    {p.featured && <Star size={12} className="text-accent fill-accent" />}
                    {!p.published && <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5">Draft</span>}
                  </div>
                  <p className="font-serif text-lg truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button onClick={() => navigate(`/admin/edit/${p.id}`)} variant="ghost" size="icon" className="rounded-none" data-testid={`edit-${p.id}`}>
                    <Pencil size={16} />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-none text-destructive" data-testid={`delete-${p.id}`}>
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif">Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del(p.id)} className="rounded-none bg-destructive" data-testid={`confirm-delete-${p.id}`}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
