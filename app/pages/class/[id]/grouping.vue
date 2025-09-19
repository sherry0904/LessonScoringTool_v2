<template>
    <div v-if="classInfo" class="p-4 sm:p-6">
        <GroupingTab :class-info="classInfo" />
    </div>
    <div v-else class="text-center p-8">
        <p>正在載入班級資料...</p>
        <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useClassesStore } from '~/stores/classes'
import GroupingTab from '~/components/GroupingTab.vue'

const classesStore = useClassesStore()
const route = useRoute()

const classId = computed(() => route.params.id as string)
const classInfo = computed(() => classesStore.classes.find((c) => c.id === classId.value))

useHead(() => ({
    title: `${classInfo.value?.name || '班級分組'} - 分組模式`,
}))
</script>
