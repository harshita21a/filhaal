import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { mediaUrl } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, ExternalLink } from "lucide-react";

const PostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/posts/${slug}`).then(({ data }) => setPost(data)).catch(() => setNotFound(true));
  }, [slug]);

  if (notFound)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-6 py-32 text-center">
          <h1 className="font-serif text-4xl mb-4">Not found</h1>
          <Link to="/" className="text-accent link-underline">Back home</Link>
        </main>
        <Footer />
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-6 py-32 text-center text-muted-foreground">Loading…</main>
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col" data-testid="post-detail-page">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 md:px-10 pt-12 md:pt-16">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-10 transition-colors" data-testid="back-link">
            <ArrowLeft size={14} /> Back
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">{post.category}</p>
          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6 fade-up" data-testid="post-title">{post.title}</h1>
          {post.excerpt && <p className="text-lg md:text-xl font-light text-muted-foreground leading-relaxed mb-8">{post.excerpt}</p>}
        </div>

        {post.cover_image && (
          <div className="max-w-5xl mx-auto px-6 md:px-10 mb-14">
            <img src={mediaUrl(post.cover_image)} alt={post.title} className="w-full object-cover" data-testid="post-cover" />
          </div>
        )}

        <article className="max-w-2xl mx-auto px-6 md:px-10">
          <div className="prose-editorial" dangerouslySetInnerHTML={{ __html: post.body }} data-testid="post-body" />

          {post.embeds?.length > 0 && (
            <div className="my-12 space-y-3" data-testid="post-embeds">
              {post.embeds.map((e, i) => (
                <a key={i} href={e.url} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-border px-5 py-4 hover:border-accent transition-colors group">
                  <span className="font-serif italic text-lg">{e.label || e.url}</span>
                  <ExternalLink size={18} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </a>
              ))}
            </div>
          )}

          {post.personal_note && (
            <div className="my-16 border-t border-b border-border py-10" data-testid="personal-note">
              <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">A personal note</p>
              <p className="font-serif italic text-2xl md:text-3xl leading-snug">{post.personal_note}</p>
            </div>
          )}

          <div className="py-16">
            <Link to={`/category/${encodeURIComponent(post.category)}`} className="text-sm uppercase tracking-[0.15em] link-underline">
              More in {post.category} →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PostDetail;
