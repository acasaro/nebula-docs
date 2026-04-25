import type { ReactNode } from "react";
import Layout from "@theme/Layout";
import { ProductLanding } from "../components/landing/ProductLanding";

export default function ProductPage(): ReactNode {
  return (
    <Layout
      title="Product"
      description="Strategy, roadmap, and initiative overviews driving the MCOE platform forward."
    >
      <main>
        <ProductLanding />
      </main>
    </Layout>
  );
}
