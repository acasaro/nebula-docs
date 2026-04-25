import React, { type ComponentType, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import type { PropBlogPostContent } from "@docusaurus/plugin-content-blog";
import styles from "../BlogListPage/styles.module.css";

export interface Props {
  readonly items: readonly { readonly content: PropBlogPostContent }[];
  readonly component?: ComponentType<{ children: ReactNode }>;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BlogPostItems({ items }: Props): React.JSX.Element {
  return (
    <>
      {items.map(({ content: BlogPostContent }) => {
        const { metadata, frontMatter } = BlogPostContent;
        const { title, permalink, date, authors, tags, description } = metadata;

        const firstAuthor = authors?.[0];

        return (
          <article key={permalink} className={styles.postCard}>
            {/* Author row */}
            <div className={styles.postHeader}>
              {firstAuthor?.imageURL ? (
                <img
                  src={firstAuthor.imageURL}
                  alt={firstAuthor.name}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {firstAuthor?.name ? getInitials(firstAuthor.name) : "?"}
                </div>
              )}
              <div className={styles.headerMeta}>
                <span className={styles.authorName}>
                  {firstAuthor?.name ?? "MCoE Team"}
                  {authors && authors.length > 1 && (
                    <> +{authors.length - 1}</>
                  )}
                </span>
                <span className={styles.postDate}>{formatDate(date)}</span>
              </div>
            </div>

            {/* Title + excerpt */}
            <h2 className={styles.postTitle}>
              <Link to={permalink}>{title}</Link>
            </h2>
            {description && (
              <p className={styles.postExcerpt}>{description}</p>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className={styles.tagRow}>
                {tags.map((tag) => (
                  <Link
                    key={tag.permalink}
                    to={tag.permalink}
                    className={styles.tag}
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            )}

            <Link to={permalink} className={styles.readMore}>
              Read more →
            </Link>
          </article>
        );
      })}
    </>
  );
}
