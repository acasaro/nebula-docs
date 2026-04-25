import type { ReactNode } from 'react';
import Layout from '@theme/Layout';
import { DeveloperLanding } from '../components/landing/DeveloperLanding';

export default function DevelopersPage(): ReactNode {
  return (
    <Layout
      title="Developer Documentation"
      description="Technical guides, CI/CD resources, and release management docs for mobile engineering teams."
    >
      <main>
        <DeveloperLanding />
      </main>
    </Layout>
  );
}
