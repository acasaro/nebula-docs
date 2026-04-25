import React from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import BlogPostItems from "@theme/BlogPostItems";
import type {
  BlogPaginatedMetadata,
  BlogSidebar,
} from "@docusaurus/plugin-content-blog";
import type { Content } from "../BlogPostPage/BlogPostPage";
import styles from "./styles.module.css";

export interface Props {
  readonly sidebar: BlogSidebar;
  readonly metadata: BlogPaginatedMetadata;
  readonly items: readonly { readonly content: Content }[];
}

export default function BlogListPage(props: Props): React.JSX.Element {
  const { metadata, items } = props;
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title="Announcements" description="Latest announcements from the MCoE team.">
      <div className={styles.feedContainer}>
        <div className={styles.feedHeader}>
          <div className={styles.channelIcon}>📢</div>
          <div>
            <h1 className={styles.channelName}>Announcements</h1>
            <p className={styles.channelDesc}>
              Latest updates and announcements from the MCoE team
            </p>
          </div>
        </div>
        <div className={styles.feedDivider} />
        <BlogPostItems items={items} />
      </div>
    </Layout>
  );
}
