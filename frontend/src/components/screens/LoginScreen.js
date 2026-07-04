import { StatusBadge } from "../shared/StatusBadge.js";
import { data } from "../../data/index.js";
import { fetchSites } from "../../api/hierarchy.js";

export const LoginScreen = {
  template: `
    <main class="login-screen">
      <section class="login-panel">
        <div class="login-brand">
          <img class="login-logo" src="./src/assets/rpulse-logo.png" alt="rhoPulse" />
        </div>
        <div class="login-status-stack">
          <div class="login-status">
            <status-badge value="green" label="Site Status" />
            <span>{{ shell.siteName }}</span>
          </div>
          <div class="login-status">
            <status-badge :value="connected === false ? 'red' : 'green'" label="Application Connection Status" />
            <span>{{ connected === null ? 'Checking...' : connected ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </div>
        <h1>Login</h1>
        <div class="field-stack">
          <label>
            <span>User</span>
            <input value="user" />
          </label>
          <label>
            <span>Password</span>
            <input type="password" value="password" />
          </label>
        </div>
        <button type="button" class="primary block" @click="$router.push({ name: 'site-status' })">Authenticate</button>
      </section>
    </main>
  `,
  components: { StatusBadge },
  data() {
    return { connected: null };
  },
  async created() {
    // No auth yet — the form stays a visual mock, but the connection badge
    // reflects whether the backend answers a cheap read.
    try {
      await fetchSites();
      this.connected = true;
    } catch {
      this.connected = false;
    }
  },
  setup() {
    return { shell: data.shell };
  },
};
