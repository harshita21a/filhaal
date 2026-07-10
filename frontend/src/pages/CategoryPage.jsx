import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";

const CategoryPage = () => {
  const { name } = useParams();
  const category = decodeURIComponent(name);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts`, { params: { category } }).then(({ data }) => {
      setPosts(data);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="min-h-screen flex flex-col" data-testid="category-page">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-3">Section</p>
          <h1 className="font-serif text-5xl md:text-6xl">{category}</h1>
        </div>
        {loading ? (
          <p className="text-muted-foreground font-light">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground font-light py-12">No posts in this section yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16" data-testid="category-grid">
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;
