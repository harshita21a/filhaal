import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api, { mediaUrl } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import { ArrowRight } from "lucide-react";

const Home = () => {
  const [featured, setFeatured] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      if (search) {
        const { data } = await api.get(`/posts`, { params: { search } });
        setPosts(data);
        setFeatured(null);
      } else {
        const [f, p] = await Promise.all([api.get(`/posts/featured`), api.get(`/posts`)]);
        setFeatured(f.data);
        setPosts(p.data.filter((x) => !f.data || x.id !== f.data.id));
      }
      setLoading(false);
    };
    load();
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-10 py-12 md:py-16">
        {search ? (
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Search results</p>
            <h1 className="font-serif text-4xl md:text-5xl">"{search}"</h1>
            <p className="text-sm text-muted-foreground mt-3">{posts.length} result{posts.length !== 1 ? "s" : ""}</p>
          </div>
        ) : (
          featured && (
            <Link to={`/post/${featured.slug}`} className="group grid md:grid-cols-12 gap-8 md:gap-12 mb-20 md:mb-28 fade-up" data-testid="hero-post">
              <div className="md:col-span-7 overflow-hidden bg-muted aspect-[5/4] md:aspect-[4/3]">
                {featured.cover_image && (
                  <img src={mediaUrl(featured.cover_image)} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                )}
              </div>
              <div className="md:col-span-5 flex flex-col justify-center">
                <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">{featured.category} · Featured</p>
                <h1 className="font-serif text-4xl md:text-5xl leading-[1.05] mb-5 group-hover:opacity-70 transition-opacity">{featured.title}</h1>
                <p className="text-base md:text-lg font-light text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.15em] group-hover:gap-3 transition-all">
                  Read <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          )
        )}

        {!search && <div className="flex items-baseline justify-between border-b border-border pb-4 mb-12">
          <h2 className="font-serif text-2xl md:text-3xl">Recently</h2>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">The diary</p>
        </div>}

        {loading ? (
          <p className="text-muted-foreground font-light">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground font-light py-12">Nothing here yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16" data-testid="posts-grid">
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

export default Home;
