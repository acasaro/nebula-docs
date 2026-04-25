import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import BlogPostItemHeaderAuthors from "@theme/BlogPostItem/Header/Authors";
import type {
  BlogMetadata,
  BlogSidebar,
  PropBlogPostContent,
} from "@docusaurus/plugin-content-blog";
import styles from "../BlogListPage/styles.module.css";

export type Content = PropBlogPostContent;

export interface Props {
  readonly sidebar: BlogSidebar;
  readonly content: Content;
  readonly blogMetadata: BlogMetadata;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function BlogPostPage(props: Props): React.JSX.Element {
  const { content: BlogPostContent } = props;
  const { metadata } = BlogPostContent;
  const { title, date, authors, tags } = metadata;
  const firstAuthor = authors?.[0];

  return (
    <Layout title={title} description={metadata.description}>
      <div className={styles.postPageContainer}>
        <Link to="/announcements" className={styles.backLink}>
          ← All announcements
        </Link>

        <div className={styles.postPageCard}>
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

          <h1 className={styles.postPageTitle}>{title}</h1>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className={styles.tagRow} style={{ marginBottom: "1rem" }}>
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

          <div className={styles.postPageContent}>
            <BlogPostContent />
          </div>
        </div>
      </div>
    </Layout>
  );
}
