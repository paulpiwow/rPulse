import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { assetSourceKey, readAssetTagConnections, tagCatalog, writeAssetTagConnection } from "../../../lib/tags.js";
import { computed, reactive, ref, useRoute } from "../../../lib/vue.js";
import { router } from "../../../router.js";

export const ConnectTags = {
  components: { ScreenHeader },
  template: `
    <div class="screen">
      <screen-header
        title="Connect Tags"
        :subtitle="connectionTitle"
      />
      <section class="panel connect-tags-screen-panel">
        <div class="connect-tags-context">
          <span>Machine: {{ machineName }}</span>
          <span>Data Source: {{ sourceName }}</span>
        </div>
        <label class="connect-tags-search">
          <span>Search Tags</span>
          <input v-model="searchTerm" placeholder="Search Tag ID, Tag Name, or Alias" />
        </label>
        <div class="connect-tags-layout">
          <section class="connect-tags-pane">
            <div class="panel-header"><h2>Tag List</h2></div>
            <table-context
              title="Available source tags"
              description="Search narrows this list without changing selected tags."
              :items="availableContextItems"
            />
            <div class="connect-tags-table-scroll">
              <table class="editable-table connect-tags-table">
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Alias</th>
                    <th>Connect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tag in filteredAvailableTagRows" :key="tag.tagId">
                    <td><input :value="tag.tagId" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input v-model="tag.alias" placeholder="Optional" /></td>
                    <td><button type="button" class="primary table-action-button" @click="connectTag(tag)">Connect</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="connect-tags-pane">
            <div class="panel-header">
              <h2>Selected Tags</h2>
              <button type="button" class="primary" @click="updateSelectedTags">Update</button>
            </div>
            <table-context
              title="Selected asset tags"
              description="Update saves the selected tag IDs and aliases."
              :items="selectedContextItems"
            />
            <div class="connect-tags-table-scroll">
              <table class="editable-table connect-tags-table">
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Alias</th>
                    <th>Deselect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tag in selectedTagRows" :key="tag.tagId">
                    <td><input :value="tag.tagId" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input :value="tag.alias" readonly /></td>
                    <td><button type="button" class="secondary table-action-button" @click="deselectTag(tag)">Deselect</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </div>
  `,
  setup() {
    const route = useRoute();
    const machineName = computed(() => String(route.query.machine || ""));
    const sourceName = computed(() => String(route.query.source || ""));
    const connectionTitle = computed(() => `${machineName.value} / ${sourceName.value}`);
    const connectionKey = computed(() => assetSourceKey(machineName.value, sourceName.value));
    const connection = readAssetTagConnections()[connectionKey.value] || { tagIds: [], aliases: {} };
    const selectedTagIds = ref([...(connection.tagIds || [])]);
    const selectedAliases = reactive({ ...(connection.aliases || {}) });
    const searchTerm = ref("");
    const availableTagRows = ref(
      tagCatalog
        .filter((tag) => tag.kind !== "CTag")
        .map((tag) => ({
          tagId: tag.tagId,
          tagName: tag.tagName,
          alias: selectedAliases[tag.tagId] || "",
        }))
    );
    const filteredAvailableTagRows = computed(() => {
      const query = searchTerm.value.trim().toLowerCase();
      if (!query) return availableTagRows.value;
      return availableTagRows.value.filter((tag) =>
        [tag.tagId, tag.tagName, tag.alias].some((value) => String(value || "").toLowerCase().includes(query))
      );
    });
    const selectedTagRows = computed(() =>
      selectedTagIds.value
        .map((tagId) => {
          const tag = tagCatalog.find((item) => item.tagId === tagId);
          if (!tag) return null;
          return {
            tagId: tag.tagId,
            tagName: tag.tagName,
            alias: selectedAliases[tag.tagId] || "",
          };
        })
        .filter(Boolean)
    );
    const availableContextItems = computed(() => [
      { label: "Visible Rows", value: filteredAvailableTagRows.value.length },
      { label: "Catalog Rows", value: availableTagRows.value.length },
    ]);
    const selectedContextItems = computed(() => [
      { label: "Selected Tags", value: selectedTagRows.value.length },
    ]);
    const persistSelection = () => {
      writeAssetTagConnection(machineName.value, sourceName.value, {
        tagIds: selectedTagIds.value,
        aliases: { ...selectedAliases },
      });
    };
    const connectTag = (tag) => {
      if (!selectedTagIds.value.includes(tag.tagId)) selectedTagIds.value.push(tag.tagId);
      const alias = String(tag.alias || "").trim();
      if (alias) selectedAliases[tag.tagId] = alias;
      if (!alias && selectedAliases[tag.tagId]) delete selectedAliases[tag.tagId];
    };
    const deselectTag = (tag) => {
      selectedTagIds.value = selectedTagIds.value.filter((tagId) => tagId !== tag.tagId);
      delete selectedAliases[tag.tagId];
      const availableRow = availableTagRows.value.find((row) => row.tagId === tag.tagId);
      if (availableRow) availableRow.alias = "";
    };
    const updateSelectedTags = () => {
      persistSelection();
    };
    return {
      machineName,
      sourceName,
      connectionTitle,
      availableContextItems,
      selectedContextItems,
      searchTerm,
      availableTagRows,
      filteredAvailableTagRows,
      selectedTagRows,
      connectTag,
      deselectTag,
      updateSelectedTags,
    };
  },
};
