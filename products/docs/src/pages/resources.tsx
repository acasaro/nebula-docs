import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import { ResourcesLanding } from "../components/landing/ResourcesLanding";

export default function ResourcesPage(): ReactNode {
  return (
    <Layout
      title="Resources"
      description="Guides, glossary, announcements, and reference materials for mobile engineering teams."
    >
      <main>
        <ResourcesLanding />
      </main>
    </Layout>
  );
}
