import { ScreenHeader } from "../../shared/ScreenHeader.js";
import { api, isDataSourceOffline } from "../../../api/client.js";
import { createTag, deleteTag, fetchAvailableTags, fetchDatasources, updateTag } from "../../../api/hierarchy.js";
import { computed, onMounted, ref, useRoute } from "../../../lib/vue.js";

export const ConnectTags = {
  components: { ScreenHeader },
  template: `
    <div class="screen">
      <screen-header
        title="Connect Tags"
        :subtitle="connectionTitle"
      />
      <div v-if="toast" class="inline-alert success">{{ toast }}</div>
      <div v-if="errorMessage" class="inline-alert">{{ errorMessage }}</div>
      <section class="panel connect-tags-screen-panel">
        <div class="connect-tags-context">
          <span>Machine: {{ machineLabel }}</span>
          <span>Data Source: {{ sourceLabel }}</span>
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
              description="Tags discoverable from the data source's backing store."
              :items="availableContextItems"
            />
            <div class="connect-tags-table-scroll">
              <p v-if="!availableTagRows.length" class="connect-tags-empty">No discoverable tags for this source type.</p>
              <table v-else class="editable-table connect-tags-table">
                <thead>
                  <tr>
                    <th>Tag ID</th>
                    <th>Tag Name</th>
                    <th>Alias</th>
                    <th>Connect</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tag in filteredAvailableTagRows" :key="tag.tagKey">
                    <td><input :value="tag.tagKey" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input v-model="tag.alias" placeholder="Optional" /></td>
                    <td><button type="button" class="primary table-action-button" :disabled="isConnected(tag.tagKey)" @click="connectTag(tag)">Connect</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="connect-tags-pane">
            <div class="panel-header">
              <h2>Selected Tags</h2>
              <button type="button" class="primary" :disabled="saving" @click="updateSelectedTags">{{ saving ? "Saving..." : "Update" }}</button>
            </div>
            <table-context
              title="Selected source tags"
              description="Update commits connections, removals, and alias edits to the backend."
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
                  <tr v-for="tag in selectedTagRows" :key="tag.rowKey">
                    <td><input :value="tag.tagId" readonly /></td>
                    <td><span class="table-display-field" :title="tag.tagName">{{ tag.tagName }}</span></td>
                    <td><input v-model="tag.alias" placeholder="Optional" /></td>
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
    const machineCode = computed(() => String(route.query.machine || ""));
    const sourceCode = computed(() => String(route.query.source || ""));
    const machineLabel = ref("");
    const sourceLabel = ref("");
    const connectionTitle = computed(() => `${machineLabel.value || machineCode.value} / ${sourceLabel.value || sourceCode.value}`);
    const searchTerm = ref("");
    const toast = ref("");
    const errorMessage = ref("");
    const saving = ref(false);
    // Left pane: tags discoverable from the source's backing store.
    const availableTagRows = ref([]);
    // Right pane: connected rows. kind "server" = already persisted (raw entity
    // kept for PUT echo bodies), kind "new" = staged locally until Update.
    const connectedRows = ref([]);
    const failMessage = (error) => (isDataSourceOffline(error) ? "Data source offline" : error.message);

    const loadPanes = async () => {
      const [available, rawConnected] = await Promise.all([
        fetchAvailableTags(sourceCode.value),
        api.get(`/datasources/${encodeURIComponent(sourceCode.value)}/tags`),
      ]);
      const discoveredNames = new Map(available.map((tag) => [tag.tagKey, tag.tagName]));
      availableTagRows.value = available.map((tag) => ({ ...tag, alias: "" }));
      connectedRows.value = rawConnected.map((raw) => ({
        kind: "server",
        rowKey: `server-${raw.code}`,
        tagId: raw.code,
        tagKey: raw.tagKey || raw.code,
        tagName: discoveredNames.get(raw.tagKey) || raw.tagName,
        alias: raw.tagName || "",
        unit: raw.unit,
        raw,
      }));
    };
    const loadContext = async () => {
      try {
        const sources = await fetchDatasources(machineCode.value);
        const source = sources.find((row) => row.dataSourceId === sourceCode.value);
        machineLabel.value = source?.machineName || machineCode.value;
        sourceLabel.value = source?.sourceName || sourceCode.value;
      } catch {
        machineLabel.value = machineCode.value;
        sourceLabel.value = sourceCode.value;
      }
    };
    onMounted(async () => {
      try {
        await Promise.all([loadPanes(), loadContext()]);
        errorMessage.value = "";
      } catch (error) {
        errorMessage.value = `Failed to load tags: ${failMessage(error)}`;
      }
    });

    const filteredAvailableTagRows = computed(() => {
      const query = searchTerm.value.trim().toLowerCase();
      if (!query) return availableTagRows.value;
      return availableTagRows.value.filter((tag) =>
        [tag.tagKey, tag.tagName, tag.alias].some((value) => String(value || "").toLowerCase().includes(query))
      );
    });
    const selectedTagRows = computed(() => connectedRows.value);
    const isConnected = (tagKey) => connectedRows.value.some((row) => row.tagKey === tagKey);
    const availableContextItems = computed(() => [
      { label: "Visible Rows", value: filteredAvailableTagRows.value.length },
      { label: "Discovered Rows", value: availableTagRows.value.length },
    ]);
    const selectedContextItems = computed(() => [
      { label: "Selected Tags", value: selectedTagRows.value.length },
      { label: "Pending Adds", value: connectedRows.value.filter((row) => row.kind === "new").length },
    ]);
    // Removals are staged: rows disappear from the pane immediately but the
    // deleteTag call only happens when Update commits.
    const stagedRemovals = ref([]);

    const connectTag = (tag) => {
      if (isConnected(tag.tagKey)) return;
      connectedRows.value.push({
        kind: "new",
        rowKey: `new-${tag.tagKey}`,
        tagId: tag.tagKey,
        tagKey: tag.tagKey,
        tagName: tag.tagName,
        alias: String(tag.alias || "").trim(),
        unit: tag.unit,
      });
      tag.alias = "";
      toast.value = "";
    };
    const deselectTag = (tag) => {
      connectedRows.value = connectedRows.value.filter((row) => row.rowKey !== tag.rowKey);
      if (tag.kind === "server") stagedRemovals.value.push(tag);
    };
    const updateSelectedTags = async () => {
      saving.value = true;
      toast.value = "";
      errorMessage.value = "";
      let changes = 0;
      try {
        for (const tag of connectedRows.value.filter((row) => row.kind === "new")) {
          await createTag(sourceCode.value, {
            code: tag.tagKey,
            tagName: String(tag.alias || "").trim() || tag.tagName,
            tagKey: tag.tagKey,
            unit: tag.unit,
            plot: true,
          });
          changes += 1;
        }
        for (const tag of stagedRemovals.value) {
          await deleteTag(tag.tagId);
          changes += 1;
        }
        for (const tag of connectedRows.value.filter((row) => row.kind === "server")) {
          const alias = String(tag.alias || "").trim() || tag.tagName;
          if (alias !== tag.raw.tagName) {
            await updateTag(tag.tagId, { ...tag.raw, tagName: alias });
            changes += 1;
          }
        }
        stagedRemovals.value = [];
        await loadPanes();
        toast.value = changes ? `Saved ${changes} tag connection change${changes === 1 ? "" : "s"}.` : "No tag connection changes to save.";
      } catch (error) {
        errorMessage.value = `Failed to save tag connections: ${failMessage(error)}`;
        try {
          stagedRemovals.value = [];
          await loadPanes();
        } catch {
          // keep the original error visible
        }
      } finally {
        saving.value = false;
      }
    };
    return {
      machineLabel,
      sourceLabel,
      connectionTitle,
      availableContextItems,
      selectedContextItems,
      searchTerm,
      toast,
      errorMessage,
      saving,
      availableTagRows,
      filteredAvailableTagRows,
      selectedTagRows,
      isConnected,
      connectTag,
      deselectTag,
      updateSelectedTags,
    };
  },
};
