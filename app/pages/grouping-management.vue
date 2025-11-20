<template>
    <div class="p-4 sm:p-6 md:p-8">
        <div class="max-w-4xl mx-auto">
            <PageHeader
                title="分組活動管理"
                description="設定分組活動進行時，儀表板的顯示方式與互動權限。"
            />

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
                            <label class="label">
                                <span class="label-text font-medium">排行榜顯示範圍</span>
                            </label>
                            <div class="flex items-center gap-4">
                                <div class="form-control">
                                    <label class="label cursor-pointer gap-2">
                                        <input
                                            type="radio"
                                            name="radio-leaderboard"
                                            class="radio radio-primary"
                                            :checked="settings.leaderboardDisplayCount === 'all'"
                                            @change="settings.leaderboardDisplayCount = 'all'"
                                        />
                                        <span class="label-text">顯示所有組別</span>
                                    </label>
                                </div>
                                <div class="form-control">
                                    <label class="label cursor-pointer gap-2">
                                        <input
                                            type="radio"
                                            name="radio-leaderboard"
                                            class="radio radio-primary"
                                            :checked="
                                                typeof settings.leaderboardDisplayCount === 'number'
                                            "
                                            @change="settings.leaderboardDisplayCount = 3"
                                        />
                                        <span class="label-text">只顯示前</span>
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    class="input input-bordered w-24"
                                    :disabled="settings.leaderboardDisplayCount === 'all'"
                                    :value="
                                        typeof settings.leaderboardDisplayCount === 'number'
                                            ? settings.leaderboardDisplayCount
                                            : 1
                                    "
                                    @input="
                                        (event) => {
                                            const value = parseInt(
                                                (event.target as HTMLInputElement).value,
                                                10,
                                            )
                                            if (!isNaN(value) && value > 0) {
                                                settings.leaderboardDisplayCount = value
                                            }
                                        }
                                    "
                                />
                                <span class="label-text">名</span>
                            </div>
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
import { watch } from 'vue'
import PageHeader from '~/components/PageHeader.vue'

definePageMeta({
    layout: 'class-dashboard',
    pageTitle: '分組管理',
})

const uiStore = useUIStore()
const { groupingSettings: settings } = storeToRefs(uiStore)

watch(
    settings,
    () => {
        uiStore.persistGroupingSettings()
    },
    { deep: true },
)
</script>

<style scoped>
/* Add any specific styles for this page if needed */
</style>
