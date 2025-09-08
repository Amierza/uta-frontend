<script setup lang="ts">
import { ref, watchEffect } from "vue";

interface Props {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

const props = defineProps<Props>();
const visible = ref(true);

// auto hide kalau ada durasi
watchEffect(() => {
  if (props.message && props.duration) {
    visible.value = true;
    setTimeout(() => {
      visible.value = false;
    }, props.duration);
  }
});
</script>

<template>
  <transition name="fade-slide">
    <div
      v-if="visible && message"
      :class="[
        'p-3 rounded-lg text-sm font-medium border',
        type === 'success'
          ? 'bg-green-100 text-green-700 border-green-300'
          : type === 'error'
          ? 'bg-red-100 text-red-700 border-red-300'
          : type === 'warning'
          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
          : 'bg-blue-100 text-blue-700 border-blue-300',
      ]"
    >
      {{ message }}
    </div>
  </transition>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
