export const StatusBadge = {
  props: ["value", "label"],
  template: `
    <span :class="['status-badge', normalized]">
      <span></span><template v-if="label !== ''">{{ label || displayLabel }}</template>
    </span>
  `,
  computed: {
    normalized() {
      return String(this.value || "unknown").toLowerCase();
    },
    displayLabel() {
      const text = String(this.value || "unknown");
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
  },
};
