<template>
    <div class="p-6 space-y-6">
        <!-- Dashboard 根據當前分頁顯示不同內容 -->
        <div v-if="ui.currentTab === 'dashboard'">
            <DashboardView />
        </div>

        <div v-else-if="ui.currentTab === 'students'">
            <StudentsView />
        </div>

        <div v-else-if="ui.currentTab === 'grouping'">
            <GroupingView />
        </div>

        <div v-else-if="ui.currentTab === 'statistics'">
            <StatisticsView />
        </div>

        <div v-else-if="ui.currentTab === 'settings'">
            <SettingsView />
        </div>

        <!-- 預設顯示 Dashboard -->
        <div v-else>
            <DashboardView />
        </div>
    </div>
</template>

<script setup lang="ts">
const ui = useUIStore()

definePageMeta({
    title: '課堂評分工具',
})
</script>
