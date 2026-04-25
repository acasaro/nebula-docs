import Layout from "@theme/Layout";
import type { ReactNode } from "react";
import { FeatureCards, FooterCta, Hero, QuickLinks, ReleasePipeline } from "../components/home";
import { styled } from "../lib/styled";

const Content = styled("div", {
  maxWidth: "960px",
  marginInline: "auto",
  padding: "48px 24px 80px",
});

const SectionTitle = styled("h2", {
  fontSize: "22px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  marginBottom: "4px",
});

const SectionSubtitle = styled("p", {
  fontSize: "14px",
  color: "var(--ifm-color-emphasis-600)",
  marginBottom: "24px",
});

export default function Home(): ReactNode {
  return (
    <Layout>
      <main>
        <Hero />
        <Content>
          <section>
            <SectionTitle>Explore the Knowledge Base</SectionTitle>
            <SectionSubtitle>Jump into any area of the MCOE documentation.</SectionSubtitle>
            <FeatureCards />
          </section>
          <section>
            <SectionTitle>Release Process</SectionTitle>
            <SectionSubtitle>
              Every mobile release follows this staged progression from build to production.
            </SectionSubtitle>
            <ReleasePipeline />
          </section>
          <QuickLinks />
          <FooterCta />
        </Content>
      </main>
    </Layout>
  );
}
