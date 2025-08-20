<template>
  <span
    :class="[
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all',
      variantClasses[variant],
      clickable && 'cursor-pointer hover:opacity-80'
    ]"
    @click="$emit('click')"
  >
    <component :is="icon" v-if="icon" class="w-3 h-3 mr-1" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  variant: {
    type: String,
    default: 'default',
    validator: (val) => ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(val)
  },
  icon: Object,
  clickable: {
    type: Boolean,
    default: false
  }
});

const variantClasses = {
  default: 'bg-gray-700 text-gray-200 border border-gray-600',
  primary: 'bg-mitchly-blue/20 text-mitchly-blue border border-mitchly-blue/30',
  secondary: 'bg-mitchly-purple/20 text-mitchly-purple border border-mitchly-purple/30',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
};

defineEmits(['click']);
</script>