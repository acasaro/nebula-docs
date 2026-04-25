import Link from "@docusaurus/Link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface FeatureItem {
  title: string;
  desc: string;
  href: string;
  accent: string;
}

const items: FeatureItem[] = [
  {
    title: "Product",
    desc: "Product strategy, roadmaps, and initiative overviews for the MCoE platform.",
    href: "/product/",
    accent: "var(--mcoe-brand-accent)",
  },
  {
    title: "Developers",
    desc: "Technical documentation for mobile CI, release management, code signing, and workflows.",
    href: "/developers/",
    accent: "var(--mcoe-brand-primary)",
  },
  {
    title: "Resources",
    desc: "Guides, glossary, announcements, and reference materials for the team.",
    href: "/resources",
    accent: "var(--mcoe-brand-primary-light)",
  },
];

export function FeatureCards() {
  return (
    <Box
      sx={{
        display: "grid",
        gap: "20px",
        mb: "48px",
        gridTemplateColumns: "1fr",
        "@media (min-width: 997px)": { gridTemplateColumns: "repeat(3, 1fr)" },
      }}
    >
      {items.map((item, i) => (
        <Card
          key={item.title}
          sx={{
            position: "relative",
            border: "1px solid var(--mcoe-border-default)",
            borderRadius: "16px",
            background: "var(--ifm-background-surface-color)",
            boxShadow: "none",
            overflow: "hidden",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            },
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "3px",
              opacity: 0.8,
              borderRadius: "16px 16px 0 0",
              background: item.accent,
              zIndex: 1,
            }}
          />
          <CardActionArea
            component={Link}
            to={item.href}
            data-analytics-surface="home.feature_cards"
            data-analytics-label={item.title}
            data-analytics-position={i}
            data-analytics-type="card"
            sx={{
              height: "100%",
              color: "inherit",
              textDecoration: "none",
              "&:hover": { color: "inherit", textDecoration: "none" },
            }}
          >
            <CardContent sx={{ p: "32px 28px", "&:last-child": { pb: "32px" } }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  display: "block",
                  fontSize: "18px",
                  fontWeight: 650,
                  lineHeight: 1.3,
                  color: "var(--mcoe-text-primary, var(--ifm-heading-color))",
                  mt: 0,
                  mb: "8px",
                }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                component="p"
                sx={{
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "var(--ifm-color-emphasis-600)",
                  mt: 0,
                  mb: "16px",
                }}
              >
                {item.desc}
              </Typography>
              <Box
                component="span"
                sx={{ fontSize: "13px", fontWeight: 600, color: item.accent }}
              >
                Explore →
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
