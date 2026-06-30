import { reactive } from "./vue.js";

export const themeState = reactive({
  darkMode: new URLSearchParams(window.location.search).get("theme") === "dark",
});
