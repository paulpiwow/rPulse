// Re-export the Vue 3 + Vue Router globals (loaded via CDN <script> in index.html).
export const {
  createApp, computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch,
} = window.Vue;
export const { createRouter, createWebHashHistory, useRoute, useRouter } = window.VueRouter;
