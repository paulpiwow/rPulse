export const DurationInput = {
  props: {
    modelValue: { type: String, default: "" },
    label: { type: String, default: "Duration" },
    options: { type: Array, default: () => [] },
    listId: { type: String, default: "duration-options" },
  },
  emits: ["update:modelValue", "commit"],
  template: `
    <label class="duration-control">
      <span v-if="label">{{ label }}</span>
      <select
        v-if="options.length"
        class="duration-input"
        :value="modelValue"
        @change="handleSelectChange"
      >
        <option v-for="option in options" :key="option.value" :value="option.label">{{ option.label }}</option>
      </select>
      <input
        v-else
        class="duration-input text-input"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('commit')"
        @keydown.enter.prevent="$emit('commit')"
      />
    </label>
  `,
  methods: {
    handleSelectChange(event) {
      this.$emit("update:modelValue", event.target.value);
      this.$emit("commit");
    },
  },
};

// Header and shell status indicator. Like the grid status renderer, this can
// be rendered as color-only when the label prop is intentionally blank.
