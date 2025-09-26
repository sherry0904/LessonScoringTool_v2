<template>
    <div v-if="classInfo" class="p-4 sm:p-6">
        <ScoringTab :class-info="classInfo" />
    </div>
    <div v-else class="text-center p-8">
        <p>正在載入班級資料...</p>
        <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import ScoringTab from '~/components/ScoringTab.vue'
import { useClassesStore } from '~/stores/classes'

const classesStore = useClassesStore()
const { currentClass } = storeToRefs(classesStore)

const classInfo = computed(() => currentClass.value ?? null)
</script>
