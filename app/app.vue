<script setup lang="ts">
const route = useRoute()

const navItems = [
  { to: '/',            label: 'DASHBOARD',   icon: 'mdi-view-dashboard-outline' },
  { to: '/history',     label: 'HISTORY',     icon: 'mdi-history'                },
  { to: '/performance', label: 'PERFORMANCE', icon: 'mdi-chart-line-variant'     },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <NuxtRouteAnnouncer />
  <v-app>

    <!-- ── Background Mesh (ambient gradient orbs) ── -->
    <div class="app-bg-mesh">
      <div class="bg-orb-3" />
    </div>

    <!-- Main content -->
    <v-main style="padding-bottom: 130px">
      <NuxtPage />
    </v-main>

    <!-- ── Frosted Glass Bottom Navigation ── -->
    <nav class="bottom-nav">

      <!-- Nav items -->
      <div class="nav-items">
        <template v-for="(item, i) in navItems" :key="item.to">

          <!-- Vertical divider between items -->
          <div v-if="i > 0" class="nav-divider" />

          <!-- Nav button -->
          <NuxtLink :to="item.to" class="nav-btn" :class="{ 'nav-btn--active': isActive(item.to) }">

            <!-- Glow dot behind active icon -->
            <span v-if="isActive(item.to)" class="nav-glow" />

            <v-icon
              :icon="item.icon"
              size="22"
              class="nav-icon"
            />
            <span class="nav-label">{{ item.label }}</span>
          </NuxtLink>

        </template>
      </div>

      <!-- iOS-style home indicator -->
      <div class="home-indicator" />

    </nav>

  </v-app>
</template>

<style scoped>
/* ── Frosted Glass Bottom Nav ── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(6, 10, 19, 0.7);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px 24px 8px;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.4);
}

/* ── Nav items row ── */
.nav-items {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Vertical divider ── */
.nav-divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

/* ── Nav button ── */
.nav-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
  text-decoration: none;
  color: rgba(148, 163, 184, 0.6);
  transition: color 0.25s ease;
  padding: 4px 0;
}

.nav-btn:hover {
  color: rgba(226, 232, 240, 0.8);
}

/* Active state */
.nav-btn--active {
  color: rgb(74, 222, 128) !important;
}

/* ── Glow dot behind active icon ── */
.nav-glow {
  position: absolute;
  top: -2px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

/* ── Icon (bold stroke when active) ── */
.nav-btn--active .nav-icon {
  font-variation-settings: 'wght' 700;
  filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.4));
}

/* ── Label ── */
.nav-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-family: 'Noto Sans Thai', sans-serif;
}

/* ── iOS home indicator ── */
.home-indicator {
  width: 33%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  margin: 16px auto 2px;
}
</style>
