<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  components: {
    type: Array,
    required: true
  }
})
const components = ref<any[]>(props.components)
</script>

<template>
  <template v-for="component in components" :key="component.id">
    <template v-if="component.type === 'v-group'">
      <v-group :config="component.config">
        <KonvaRecursiveComponent :components="component.children"/>
      </v-group>
    </template>
    <template v-else>
      <component :is="component.type" :config="component.config"/>
    </template>
  </template>
</template>

<style scoped></style>