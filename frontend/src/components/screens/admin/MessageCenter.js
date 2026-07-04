import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { acknowledgeMessage, fetchMessages } from "../../../api/admin.js";
import { isDataSourceOffline } from "../../../api/client.js";
import { refreshStore } from "../../../api/store.js";
import { statusRenderer } from "../../../lib/grid.js";

export const MessageCenter = {
  components: { ScreenHeader, GridTable },
  data() {
    return {
      rows: [],
      error: "",
      toast: "",
    };
  },
  async created() {
    await this.loadRows();
  },
  template: `
    <div class="screen">
      <screen-header title="Message Center" subtitle="Unread messages and message history" />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="panel-header"><h2>Unread Message List and History</h2></div>
        <table-context
          title="Message rows"
          description="Unread and acknowledged alarm, license, and application messages."
          :items="[
            { label: 'Messages', value: rows.length },
            { label: 'Unread', value: unreadCount },
            { label: 'Action', value: 'Acknowledge' }
          ]"
        />
        <grid-table
          :rows="rows"
          :columns="columns"
          :actions="[{ label: 'Acknowledge', key: 'ack' }]"
          height="500px"
          @action="acknowledge"
        />
      </section>
    </div>
  `,
  computed: {
    unreadCount() {
      return this.rows.filter((row) => row.status === "Unread").length;
    },
    columns() {
      return [
        { headerName: "Message ID", field: "messageId", width: 130 },
        { headerName: "Title", field: "title", flex: 1.4 },
        { headerName: "Target", field: "target", flex: 1 },
        { headerName: "Created", field: "createdAt", width: 170 },
        { headerName: "Status", field: "status", cellRenderer: statusRenderer, width: 140 },
      ];
    },
  },
  methods: {
    async loadRows() {
      try {
        this.rows = await fetchMessages();
        this.error = "";
      } catch (error) {
        this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Failed to load messages.";
      }
    },
    async acknowledge({ row }) {
      if (row.status !== "Unread") return;
      try {
        const updated = await acknowledgeMessage(row.messageId);
        const index = this.rows.findIndex((item) => item.messageId === row.messageId);
        if (index >= 0) this.rows[index] = { ...this.rows[index], ...updated };
        this.error = "";
        this.toast = `Message ${row.messageId} acknowledged.`;
        refreshStore();
      } catch (error) {
        this.toast = "";
        this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Acknowledge failed.";
      }
    },
  },
};
