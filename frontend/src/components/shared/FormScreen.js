import { ScreenHeader } from "./ScreenHeader.js";
import { isDataSourceOffline } from "../../api/client.js";

// Generic form screen. Field defs (from router.js) drive both rendering and
// state: each field needs a `name` (falls back to `label`) plus optional
// type ("select" | "multiselect" | "textarea" | "numeric"), options, value
// (initial), placeholder, readonly, wide.
//
// Route-level behavior is injected through two optional function props:
// - load(route): async, returns either a flat { fieldName: value } object or
//   { values, options } where options is { fieldName: [option, ...] } for
//   selects whose choices come from the backend.
// - onSubmit(values, route): async, invoked with the current field values on
//   the primary action. Throwing shows an error message; on success the
//   screen navigates back, or to the route name returned by onSubmit.
function fieldName(field) {
  return field.name || field.label;
}

export const FormScreen = {
  props: ["title", "subtitle", "fields", "primaryLabel", "load", "onSubmit"],
  components: { ScreenHeader },
  data() {
    const values = {};
    (this.fields || []).forEach((field) => {
      values[fieldName(field)] = field.type === "multiselect" ? [] : field.value ?? "";
    });
    return { values, loadedOptions: {}, toast: "", error: "", loading: false, saving: false };
  },
  async created() {
    if (!this.load) return;
    this.loading = true;
    try {
      const result = (await this.load(this.$route)) || {};
      const wrapped = result.values !== undefined || result.options !== undefined;
      const values = wrapped ? result.values || {} : result;
      Object.entries(values).forEach(([key, value]) => {
        if (key in this.values && value !== undefined && value !== null) this.values[key] = value;
      });
      if (result.options) this.loadedOptions = { ...this.loadedOptions, ...result.options };
    } catch (error) {
      this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Failed to load form data.";
    } finally {
      this.loading = false;
    }
  },
  methods: {
    name(field) {
      return fieldName(field);
    },
    fieldOptions(field) {
      return this.loadedOptions[fieldName(field)] || field.options || [];
    },
    optionValue(option) {
      return option && typeof option === "object" ? option.value : option;
    },
    optionLabel(option) {
      return option && typeof option === "object" ? option.label : option;
    },
    async submit() {
      if (!this.onSubmit || this.saving) return;
      this.saving = true;
      this.error = "";
      this.toast = "";
      try {
        const redirect = await this.onSubmit({ ...this.values }, this.$route);
        this.toast = "Saved.";
        if (typeof redirect === "string") this.$router.push({ name: redirect });
        else this.$router.back();
      } catch (error) {
        this.error = isDataSourceOffline(error) ? "Data source offline" : error.message || "Save failed.";
      } finally {
        this.saving = false;
      }
    },
  },
  template: `
    <div class="screen">
      <screen-header :title="title" :subtitle="subtitle" />
      <div v-if="error" class="inline-alert">{{ error }}</div>
      <div v-else-if="toast" class="inline-alert success">{{ toast }}</div>
      <section class="panel">
        <div class="field-grid three">
          <label v-for="field in fields" :key="name(field)" :class="{ wide: field.wide }">
            <span>{{ field.label }}</span>
            <select v-if="field.type === 'select'" v-model="values[name(field)]" :disabled="field.readonly">
              <option v-for="option in fieldOptions(field)" :key="optionValue(option)" :value="optionValue(option)">
                {{ optionLabel(option) }}
              </option>
            </select>
            <select
              v-else-if="field.type === 'multiselect'"
              multiple
              v-model="values[name(field)]"
              :disabled="field.readonly"
              :size="Math.min(Math.max(fieldOptions(field).length, 3), 6)"
            >
              <option v-for="option in fieldOptions(field)" :key="optionValue(option)" :value="optionValue(option)">
                {{ optionLabel(option) }}
              </option>
            </select>
            <textarea
              v-else-if="field.type === 'textarea'"
              rows="3"
              v-model="values[name(field)]"
              :placeholder="field.placeholder || ''"
              :readonly="field.readonly"
            ></textarea>
            <input
              v-else
              :class="field.type === 'numeric' ? 'numeric-input' : 'text-input'"
              :inputmode="field.type === 'numeric' ? 'decimal' : undefined"
              v-model="values[name(field)]"
              :placeholder="field.placeholder || ''"
              :readonly="field.readonly"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary" @click="$router.back()">Cancel</button>
          <button type="button" class="primary" :disabled="saving || loading" @click="submit">
            {{ saving ? 'Saving...' : primaryLabel || 'Save' }}
          </button>
        </div>
      </section>
    </div>
  `,
};
