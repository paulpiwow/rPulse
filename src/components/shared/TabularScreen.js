import { GridTable } from "./GridTable.js";
import { ScreenHeader } from "./ScreenHeader.js";

export const TabularScreen = {
  props: ["title", "subtitle", "rows", "columns", "status"],
  components: { ScreenHeader, GridTable },
  template: `
    <div class="screen">
      <screen-header :title="title" :subtitle="subtitle" :status="status" />
      <section class="panel">
        <div class="panel-header"><h2>{{ title }}</h2></div>
        <grid-table :rows="rows" :columns="columns" height="520px" />
      </section>
    </div>
  `,
};
