import { GridTable } from "./GridTable.js";
import { data } from "../../data/index.js";

export const MatrixPanel = {
  components: { GridTable },
  template: `
    <section class="panel">
      <div class="panel-header">
        <h2>Interaction Matrix Watchlist</h2>
        <span class="panel-note">Routes and modal states derived from the latest matrix</span>
      </div>
      <grid-table :rows="rows" :columns="columns" height="260px" compact />
    </section>
  `,
  setup() {
    return {
      rows: data.screenMatrix.map(([from, action, to]) => ({ from, action, to })),
      columns: [
        { headerName: "From Screen", field: "from", flex: 1 },
        { headerName: "Action", field: "action", flex: 1 },
        { headerName: "To Screen / State", field: "to", flex: 1 },
      ],
    };
  },
};
