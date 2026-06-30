export const TableContext = {
  props: {
    title: String,
    description: String,
    items: { type: Array, default: () => [] },
  },
  template: `
    <div class="table-context" v-if="visibleItems.length">
      <dl v-if="visibleItems.length" class="table-context-meta">
        <div v-for="item in visibleItems" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </div>
  `,
  computed: {
    visibleItems() {
      return this.items.filter((item) => item && item.label && item.value !== undefined && item.value !== null && item.value !== "");
    },
  },
};
