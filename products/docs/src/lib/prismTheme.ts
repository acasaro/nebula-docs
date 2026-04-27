import type { PrismTheme } from "prism-react-renderer";

// Dark navy surface with mcoe-default brand accents.
// Surface: #1a1d2e (desaturated navy, related to brand primary #5469d4)
// Keyword/tag: #84a9ff (brand primary lightened for dark bg)
// String: #e394dc (soft pink-purple — complement to brand)
// Number/boolean/constant: #79c0ff (GitHub Primer blue.3 — pairs with navy)
// Function: #d2a8ff (purple.3 — close to brandAccent)
// Comment: #6b7498 (muted slate)
// Plain text: #cdd5e0

const mcoeCodeTheme: PrismTheme = {
  plain: {
    color: "#cdd5e0",
    backgroundColor: "#1a1d2e",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#6b7498", fontStyle: "italic" },
    },
    {
      types: ["namespace"],
      style: { opacity: 0.7 },
    },
    {
      types: ["string", "attr-value"],
      style: { color: "#e394dc" },
    },
    {
      types: ["punctuation", "operator"],
      style: { color: "#8892b0" },
    },
    {
      types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"],
      style: { color: "#79c0ff" },
    },
    {
      types: ["atrule", "attr-name", "selector"],
      style: { color: "#84a9ff" },
    },
    {
      types: ["keyword"],
      style: { color: "#84a9ff", fontWeight: "600" },
    },
    {
      types: ["function", "deleted", "tag"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["function-variable"],
      style: { color: "#d2a8ff" },
    },
    {
      types: ["tag", "selector"],
      style: { color: "#84a9ff" },
    },
    {
      types: ["class-name", "builtin"],
      style: { color: "#ffa657" },
    },
  ],
};

export default mcoeCodeTheme;
