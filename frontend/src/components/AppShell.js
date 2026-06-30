import { StatusBadge } from "./shared/StatusBadge.js";
import { data } from "../data/index.js";
import { themeState } from "../lib/state.js";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "../lib/vue.js";

export const AppShell = {
  components: { StatusBadge },
  setup() {
    const now = ref(new Date());
    const timer = setInterval(() => {
      now.value = new Date();
    }, 30000);
    watch(
      () => themeState.darkMode,
      (enabled) => {
        nextTick(() => {
          window.dispatchEvent(new CustomEvent("rpulse-theme-change", { detail: { darkMode: enabled } }));
        });
      },
      { immediate: true }
    );
    onBeforeUnmount(() => clearInterval(timer));
    const navSections = computed(() =>
      data.navSections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.route === "active-alarms") return { ...item, count: data.activeAlarms.length, status: "red" };
          if (item.route === "baseline-deviations") return { ...item, count: data.baselineDeviations.length, status: "yellow" };
          if (item.route === "message-center") {
            return { ...item, count: data.messages.filter((message) => message.status === "Unread").length };
          }
          return item;
        }),
      }))
    );
    return {
      shell: data.shell,
      navSections,
      now,
      themeState,
    };
  },
  computed: {
    isPublic() {
      return this.$route.meta.public;
    },
    dateLabel() {
      return this.now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    },
    timeLabel() {
      return this.now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    },
    breadcrumb() {
      return [this.$route.meta.title || ""].filter(Boolean);
    },
    sectionHomeRoute() {
      const group = this.$route.meta.group;
      if (group === "Configure") return "asset-inventory";
      if (group === "Admin") return "license-management";
      return "site-status";
    },
    sectionLabel() {
      return this.$route.meta.group || "Operate";
    },
    currentTitle() {
      return this.$route.meta.title || "Operations Console";
    },
  },
  methods: {
    // Small inline icons keep the static prototype dependency-free while
    // matching the Clean Shell requirement for icons in the main nav panel.
    navIconPath(icon) {
      const paths = {
        status: "M4 11h4l2-5 4 10 2-5h4",
        alarm: "M10 5a4 4 0 0 1 8 0v4l2 4H8l2-4V5m3 12h4",
        history: "M12 8v5l4 2M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5",
        deviation: "M4 17l5-5 3 3 6-8M4 20h16",
        asset: "M4 7h16v10H4zM7 7V4h10v3M7 17v3m10-3v3",
        bell: "M10 5a4 4 0 0 1 8 0v5l2 4H8l2-4V5m3 12h4",
        groups: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6m8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a5 5 0 0 1 10 0m-2 0a5 5 0 0 1 10 0",
        application: "M4 5h16v14H4zM4 9h16M8 13h3m3 0h3M8 16h6",
        user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",
        message: "M4 5h16v12H7l-3 3z",
      };
      return paths[icon] || paths.application;
    },
  },
  template: `
    <router-view v-if="isPublic"></router-view>
    <div v-else :class="['app-shell', { 'theme-dark': themeState.darkMode }]">
      <aside class="side-nav">
        <div class="brand-row">
          <img class="brand-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
        </div>
        <nav>
          <section v-for="section in navSections" :key="section.label">
            <h2>{{ section.label }}</h2>
            <router-link v-for="item in section.items" :key="item.route" :to="{ name: item.route }" class="nav-link">
              <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="navIconPath(item.icon)" />
              </svg>
              <span>{{ item.label }}</span>
              <strong v-if="item.count" :class="['nav-count', item.status || 'red']">{{ item.count }}</strong>
            </router-link>
          </section>
        </nav>
        <div class="side-footer">
          <span>&copy; {{ shell.company }}</span>
          <span>{{ shell.version }} &rho; Pulse</span>
        </div>
      </aside>
      <div class="shell-main">
        <header class="top-bar">
          <div class="site-context">
            <span>{{ shell.siteName }}</span>
            <span>-</span>
            <span>{{ shell.siteLocation }}</span>
          </div>
          <div class="sync-center">
            <span :class="['status-dot', shell.status]"></span>
            <span>Synced {{ shell.syncAge }}</span>
          </div>
          <div class="top-meta">
            <span>{{ dateLabel }}</span>
            <span>{{ timeLabel }}</span>
            <span>{{ shell.userName }}</span>
          </div>
        </header>
        <main class="content-shell">
          <router-view></router-view>
        </main>
      </div>
    </div>
  `,
};
