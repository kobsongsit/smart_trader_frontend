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

    <!-- Main content — enough padding so content clears the bottom nav -->
    <!-- inline style แทน pb-28 เพราะ Vuetify spacing util รองรับแค่ 0-16 -->
    <v-main style="padding-bottom: 130px">
      <NuxtPage />
    </v-main>

    <!-- ── Custom Bottom Navigation ── -->
    <nav class="bottom-nav">

      <!-- Nav items -->
      <div class="nav-items">
        <template v-for="(item, i) in navItems" :key="item.to">

          <!-- Vertical divider between items -->
          <div v-if="i > 0" class="nav-divider" />

          <!-- Nav button -->
          <NuxtLink :to="item.to" class="nav-btn" :class="{ 'nav-btn--active': isActive(item.to) }">
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
/* ── Bottom nav container ── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #1A2234;
  border-top: 1px solid rgb(51 65 85 / 0.7);
  padding: 12px 24px 8px;
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
  background: rgb(30 41 59);
  flex-shrink: 0;
}

/* ── Nav button ── */
.nav-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  flex: 1;
  text-decoration: none;
  color: rgb(100 116 139);
  transition: color 0.2s ease;
  padding: 4px 0;
}

.nav-btn:hover {
  color: rgb(203 213 225);
}

/* Active state */
.nav-btn--active {
  color: rgb(52 211 153) !important;
}

/* ── Icon (bold stroke when active) ── */
.nav-btn--active .nav-icon {
  font-variation-settings: 'wght' 700;
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
  background: rgb(100 116 139);
  border-radius: 9999px;
  margin: 16px auto 2px;
}
</style>
