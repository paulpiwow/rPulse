import { StatusBadge } from "../shared/StatusBadge.js";
import { data } from "../../data/index.js";

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
            <status-badge value="green" label="Application Connection Status" />
            <span>Connected</span>
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
  setup() {
    return { shell: data.shell };
  },
};
