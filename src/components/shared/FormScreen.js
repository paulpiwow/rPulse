import { ScreenHeader } from "./ScreenHeader.js";

export const FormScreen = {
  props: ["title", "subtitle", "fields", "primaryLabel"],
  components: { ScreenHeader },
  template: `
    <div class="screen">
      <screen-header :title="title" :subtitle="subtitle" />
      <section class="panel">
        <div class="field-grid three">
          <label v-for="field in fields" :key="field.label" :class="{ wide: field.wide }">
            <span>{{ field.label }}</span>
            <select v-if="field.type === 'select'">
              <option v-for="option in field.options" :key="option">{{ option }}</option>
            </select>
            <textarea v-else-if="field.type === 'textarea'" rows="3" :placeholder="field.placeholder || ''"></textarea>
            <input
              v-else
              :class="field.type === 'numeric' ? 'numeric-input' : 'text-input'"
              :inputmode="field.type === 'numeric' ? 'decimal' : undefined"
              :value="field.value || ''"
              :placeholder="field.placeholder || ''"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="button" class="secondary" @click="$router.back()">Cancel</button>
          <button type="button" class="primary">{{ primaryLabel || 'Save' }}</button>
        </div>
      </section>
    </div>
  `,
};
