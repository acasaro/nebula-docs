import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import { AboutLanding } from "../components/landing/AboutLanding";

export default function AboutPage(): ReactNode {
  return (
    <Layout
      title="About MCOE"
      description="Learn about the Mobile Center of Excellence and how it supports mobile development."
    >
      <main>
        <AboutLanding />
      </main>
    </Layout>
  );
}
