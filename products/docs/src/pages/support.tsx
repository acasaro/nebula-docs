import Link from "@docusaurus/Link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Layout from "@theme/Layout";

const TEAMS_CHANNEL_URL =
  "https://teams.microsoft.com/l/channel/19%3AFB03vfnBjkHc360bOnohA0H4pCtPJsCqsOXC3lulyyA1%40thread.tacv2?groupId=bf4a70a5-9ee7-4340-9272-c4b2a47dded7&tenantId=db05faca-c82a-4b9d-b9c5-0f64b6755421";

interface OfficeHour {
  day: string;
  time: string;
  focus: string;
}

const officeHours: OfficeHour[] = [
  { day: "Thursday", time: "2:00 – 3:00 PM CT", focus: "Onboarding & Migrations" },
  { day: "Friday", time: "10:00 – 11:00 AM CT", focus: "General Q&A" },
];

interface Channel {
  title: string;
  desc: string;
  tag: string;
  href: string;
  accent: string;
  external?: boolean;
}

const channels: Channel[] = [
  {
    title: "Teams Channel",
    desc: "Chat with the MCoE team and other mobile engineers in real time. Office hours run here, and async questions are triaged daily by the on-rotation engineer.",
    tag: "Live",
    href: TEAMS_CHANNEL_URL,
    accent: "var(--mcoe-brand-accent)",
    external: true,
  },
  {
    title: "Announcements",
    desc: "Weekly feed of platform updates — Bitrise migrations, rollout changes, new tooling, and retrospectives from office hours.",
    tag: "Weekly",
    href: "/announcements",
    accent: "var(--mcoe-brand-primary)",
  },
  {
    title: "Developer Docs",
    desc: "Self-serve guides for CI/CD, release management, code signing, and platform access. The fastest route for most questions.",
    tag: "Self-serve",
    href: "/developers",
    accent: "var(--mcoe-brand-primary-light)",
  },
];

export default function Support() {
  return (
    <Layout>
      {/* Hero */}
      <Box
        sx={{
          padding: "64px 48px 48px",
          backgroundImage:
            "linear-gradient(135deg, rgba(241,245,249,0.93) 0%, rgba(237,242,247,0.95) 40%, rgba(231,238,244,0.96) 100%), url(/images/landing/pixel-pattern-hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          '[data-theme="dark"] &': {
            backgroundImage:
              "linear-gradient(135deg, rgba(20,27,35,0.92) 0%, rgba(20,27,35,0.95) 100%), url(/images/landing/pixel-pattern-hero.jpg)",
          },
          "@media (max-width: 996px)": { padding: "40px 24px 32px" },
        }}>
        <Box sx={{ maxWidth: "960px", mx: "auto" }}>
          <Typography
            component='h1'
            sx={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "var(--mcoe-brand-display)",
              lineHeight: 1.15,
              mb: "8px",
              letterSpacing: "-0.02em",
            }}>
            Support
          </Typography>
          <Typography
            component='p'
            sx={{
              fontSize: "15px",
              color: "var(--mcoe-text-secondary)",
              m: 0,
              maxWidth: "570px",
            }}>
            How to reach the MCoE team, stay current on platform updates, and find answers.
          </Typography>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ background: "var(--mcoe-bg-primary)", minHeight: "100vh" }}>
        <Box sx={{ maxWidth: "960px", mx: "auto", padding: "40px 24px 80px" }}>
          {/* Office Hours */}
          <Typography
            component='h2'
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--ifm-heading-color)",
              mt: 0,
              mb: "4px",
            }}>
            Office Hours
          </Typography>
          <Typography
            component='p'
            sx={{
              fontSize: "14px",
              color: "var(--mcoe-text-secondary)",
              mt: 0,
              mb: "24px",
            }}>
            Drop into the MCoE Teams channel during office hours for live help — no ticket, no
            queue.
          </Typography>
          <Card
            sx={{
              mb: "48px",
              border: "1px solid var(--mcoe-border-default)",
              borderRadius: "16px",
              background: "var(--ifm-background-surface-color)",
              boxShadow: "none",
            }}>
            <CardContent sx={{ p: "28px", "&:last-child": { pb: "28px" } }}>
              <Stack spacing='16px'>
                {officeHours.map((oh) => (
                  <Box
                    key={oh.day}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr auto",
                      alignItems: "center",
                      gap: "16px",
                      "@media (max-width: 640px)": {
                        gridTemplateColumns: "1fr",
                        gap: "4px",
                      },
                    }}>
                    <Typography
                      component='span'
                      sx={{
                        fontSize: "15px",
                        fontWeight: 650,
                        color: "var(--ifm-font-color-base)",
                      }}>
                      {oh.day}
                    </Typography>
                    <Typography
                      component='span'
                      sx={{
                        fontSize: "14px",
                        color: "var(--ifm-color-emphasis-600)",
                      }}>
                      {oh.time}
                    </Typography>
                    <Chip
                      label={oh.focus}
                      size='small'
                      sx={{
                        height: "auto",
                        borderRadius: "100px",
                        background: "var(--mcoe-info-light)",
                        color: "var(--mcoe-info)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        justifySelf: "start",
                        "& .MuiChip-label": { padding: "3px 10px" },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
              <Box
                sx={{
                  mt: "20px",
                  pt: "20px",
                  borderTop: "1px solid var(--mcoe-border-default)",
                  fontSize: "13px",
                  color: "var(--ifm-color-emphasis-600)",
                  lineHeight: 1.6,
                }}>
                All sessions run in the MCoE Teams channel. Questions posted between sessions are
                triaged daily, and recurring themes get rolled up into the weekly{" "}
                <Link to='/announcements'>Announcements feed</Link>.
              </Box>
            </CardContent>
          </Card>

          {/* Ways to reach us */}
          <Typography
            component='h2'
            sx={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--ifm-heading-color)",
              mt: 0,
              mb: "4px",
            }}>
            Ways to reach us
          </Typography>
          <Typography
            component='p'
            sx={{
              fontSize: "14px",
              color: "var(--mcoe-text-secondary)",
              mt: 0,
              mb: "24px",
            }}>
            Three on-ramps depending on whether you need a person, a feed, or a doc.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: "20px",
              gridTemplateColumns: "1fr",
              "@media (min-width: 768px)": { gridTemplateColumns: "repeat(3, 1fr)" },
            }}>
            {channels.map((ch, i) => (
              <Card
                key={ch.title}
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
                }}>
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background: ch.accent,
                    zIndex: 1,
                  }}
                />
                <CardActionArea
                  component={Link}
                  to={ch.href}
                  data-analytics-surface="support.channels"
                  data-analytics-label={ch.title}
                  data-analytics-position={i}
                  data-analytics-type="card"
                  {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  sx={{
                    height: "100%",
                    color: "inherit",
                    textDecoration: "none",
                    "&:hover": { color: "inherit", textDecoration: "none" },
                  }}>
                  <CardContent sx={{ p: "28px", "&:last-child": { pb: "28px" } }}>
                    <Chip
                      label={ch.tag}
                      size='small'
                      sx={{
                        mb: "12px",
                        height: "auto",
                        borderRadius: "100px",
                        background: ch.accent,
                        color: "#fff",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        "& .MuiChip-label": { padding: "3px 10px" },
                      }}
                    />
                    <Typography
                      variant='h6'
                      component='h3'
                      sx={{
                        display: "block",
                        fontSize: "17px",
                        fontWeight: 650,
                        lineHeight: 1.3,
                        color: "var(--mcoe-text-primary, var(--ifm-heading-color))",
                        mt: 0,
                        mb: "8px",
                      }}>
                      {ch.title}
                    </Typography>
                    <Typography
                      variant='body2'
                      component='p'
                      sx={{
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "var(--ifm-color-emphasis-600)",
                        m: 0,
                      }}>
                      {ch.desc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
