import { GridTable } from "../../shared/GridTable.js";
import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { data } from "../../../data/index.js";
import { statusRenderer } from "../../../lib/grid.js";

export const MessageCenter = {
  components: { ScreenHeader, GridTable },
  data() {
    return {
      rows: data.messages.map((row) => ({ ...row })),
    };
  },
  template: `
    <div class="screen">
      <screen-header title="Message Center" subtitle="Unread messages and message history" />
      <section class="panel">
        <div class="panel-header"><h2>Unread Message List and History</h2></div>
        <table-context
          title="Message rows"
          description="Unread and acknowledged alarm, license, and application messages."
          :items="[
            { label: 'Messages', value: rows.length },
            { label: 'Unread', value: rows.filter((row) => row.status === 'Unread').length },
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
    acknowledge({ row }) {
      const target = this.rows.find((item) => item.messageId === row.messageId);
      if (target) target.status = "Acknowledged";
    },
  },
};
