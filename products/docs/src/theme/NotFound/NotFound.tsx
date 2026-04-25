import React, { type ReactNode } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function NotFound(): ReactNode {
  return (
    <Layout title="Page Not Found">
      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.code}>404</div>
          <h1 className={styles.title}>Page not found</h1>
          <p className={styles.message}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className={styles.actions}>
            <Link to="/" className={styles.primaryAction}>
              Go Home
            </Link>
            <Link to="/developers/" className={styles.secondaryAction}>
              Browse Docs
            </Link>
          </div>
          <div className={styles.links}>
            <h3 className={styles.linksTitle}>Popular pages</h3>
            <ul className={styles.linksList}>
              <li><Link to="/developers/release-management/getting-started">Getting Started with Rollouts</Link></li>
              <li><Link to="/developers/mobile-ci/about-mobile-ci">Mobile CI</Link></li>
              <li><Link to="/developers/mobile-ci/mobile-workflows/code-signing/ios/ios-code-signing">iOS Code Signing</Link></li>
              <li><Link to="/resources/guides">Guides</Link></li>
            </ul>
          </div>
        </div>
      </main>
    </Layout>
  );
}
