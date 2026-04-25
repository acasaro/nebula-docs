import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import {
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';
import NavbarSearch from '@theme/Navbar/Search';


import styles from './styles.module.css';
import Button from '@mui/material/Button';

const tabs = [
  { label: 'Overview', href: '/' },
  { label: 'Developers', href: '/developers/' },
  { label: 'Product', href: '/product/' },
  { label: 'Resources', href: '/resources/' },
  { label: 'About', href: '/about/' },
];

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const { pathname } = useLocation();
  return (
    <>
      {/* ── Row 1: Logo + right links + search + color mode ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
          <span data-analytics-surface="navbar.logo" data-analytics-label="Home">
            <NavbarLogo />
          </span>
        </div>

        <div className={styles.topBarRight}>
          {/* ── Search ── */}
          <div className={styles.navSearch} data-analytics-surface="navbar.search">
            <NavbarSearch>
              <SearchBar />
            </NavbarSearch>
          </div>


          {/* ── Icon buttons ── */}
          <div className={styles.navIconButtons}>
            <a
              href="/announcements"
              className={styles.notifButton}
              aria-label="Announcements"
              data-analytics-surface="navbar.announcements_bell"
              data-analytics-label="Announcements"
              data-analytics-type="icon_button"
            >
              <svg className={styles.notifIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
            </a>
            <span
              data-analytics-surface="navbar.color_mode_toggle"
              data-analytics-label="Color mode"
              data-analytics-type="icon_button"
            >
              <NavbarColorModeToggle className={styles.colorModeToggle} />
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Tab bar + Utility links ── */}
      <div className={styles.tabBar}>
        <div className={styles.tabList}>
          {tabs.map((tab, i) => {
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href.replace(/\/$/, ''));
            return (
              <a
                key={tab.label}
                href={tab.href}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                data-analytics-surface="navbar.tabs"
                data-analytics-label={tab.label}
                data-analytics-position={i}
                data-analytics-type="tab"
              >
                {tab.label}
              </a>
            );
          })}
        </div>

        {/* ── Utility links ── */}
        <div className={styles.navUtilityLinks}>
          <Button
            component={Link}
            to="/support"
            variant={'outlined'}
            color="primary"
            size='small'
            data-analytics-surface="navbar.support"
            data-analytics-label="Support"
            data-analytics-type="cta"
          >
            Support
          </Button>
          <a
            href="https://teams.microsoft.com/l/channel/19%3AFB03vfnBjkHc360bOnohA0H4pCtPJsCqsOXC3lulyyA1%40thread.tacv2?groupId=bf4a70a5-9ee7-4340-9272-c4b2a47dded7&tenantId=db05faca-c82a-4b9d-b9c5-0f64b6755421"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.teamsLink}
            data-analytics-surface="navbar.teams_chat"
            data-analytics-label="Chat with us"
            data-analytics-type="cta"
          >
           <img src="/images/icons/ms-teams-logo.svg" alt="" className={styles.teamsIcon} />
            <span>Chat with us</span>
          </a>


        </div>
      </div>
    </>
  );
}
