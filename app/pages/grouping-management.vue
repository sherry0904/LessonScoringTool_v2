<template>
    <div class="p-4 sm:p-6 md:p-8">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-2xl font-bold mb-6 flex items-center">
                <LucideIcon name="Settings2" class="w-6 h-6 mr-3" />
                分組活動管理
            </h1>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- 顯示設定 -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">儀表板顯示設定</h2>
                        <p class="text-sm text-base-content/70 mb-4">
                            設定分組活動進行時，儀表板的顯示方式。
                        </p>

                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text font-medium">顯示各組總積分</span>
                                <input
                                    v-model="settings.showGroupTotalScores"
                                    type="checkbox"
                                    class="toggle toggle-primary"
                                />
                            </label>
                        </div>

                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text font-medium">顯示各學生積分</span>
                                <input
                                    v-model="settings.showStudentIndividualScores"
                                    type="checkbox"
                                    class="toggle toggle-primary"
                                />
                            </label>
                        </div>

                        <div class="form-control w-full">
                            <label class="label mb-2">
                                <span class="label-text font-medium">排行榜顯示範圍</span>
                            </label>
                            <select
                                v-model="settings.leaderboardDisplayCount"
                                class="select select-bordered"
                            >
                                <option value="all">顯示所有組別</option>
                                <option :value="3">只顯示前 3 名</option>
                                <option :value="5">只顯示前 5 名</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 互動設定 -->
                <div class="card bg-base-100 shadow">
                    <div class="card-body">
                        <h2 class="card-title text-lg">評分互動設定</h2>
                        <p class="text-sm text-base-content/70 mb-4">
                            設定分組活動期間的評分權限與方式。
                        </p>

                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text font-medium">允許對組內個別學生加減分</span>
                                <input
                                    v-model="settings.allowIndividualScoring"
                                    type="checkbox"
                                    class="toggle toggle-primary"
                                />
                            </label>
                            <div class="label">
                                <span class="label-text-alt"
                                    >關閉後，老師將只能對整個小組進行加減分。</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUIStore } from '~/stores/ui'

definePageMeta({
    layout: 'class-dashboard',
    pageTitle: '分組管理',
})

const uiStore = useUIStore()
const { groupingSettings: settings } = storeToRefs(uiStore)
</script>

<style scoped>
/* Add any specific styles for this page if needed */
</style>
