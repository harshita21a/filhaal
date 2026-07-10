import React from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "@/lib/api";

export const PostCard = ({ post, index = 0 }) => (
  <Link
    to={`/post/${post.slug}`}
    className="group block fade-up"
    style={{ animationDelay: `${index * 80}ms` }}
    data-testid={`post-card-${post.slug}`}
  >
    <div className="overflow-hidden mb-5 bg-muted aspect-[4/3]">
      {post.cover_image ? (
        <img
          src={mediaUrl(post.cover_image)}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-muted" />
      )}
    </div>
    <p className="text-xs uppercase tracking-[0.2em] text-accent mb-2">{post.category}</p>
    <h3 className="font-serif text-2xl leading-snug mb-2 group-hover:opacity-70 transition-opacity">
      {post.title}
    </h3>
    <p className="text-sm font-light text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
  </Link>
);
