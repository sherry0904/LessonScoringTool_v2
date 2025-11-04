<template>
    <div class="card bg-base-100 shadow-sm">
        <div class="card-body p-4">
            <template v-if="!groupingActive">
                <div class="flex flex-col gap-3">
                    <div v-if="isGroupEditMode" class="flex flex-wrap items-center gap-2">
                        <span class="badge badge-info gap-2">
                            <LucideIcon name="Pencil" class="w-3 h-3" />編輯模式中
                        </span>
                        <div class="form-control mr-2">
                            <label class="label py-1 mr-1">
                                <span class="label-text">組數</span>
                            </label>
                            <input
                                :value="groupCountInput"
                                type="number"
                                :min="groupCountMin"
                                :max="groupCountMax"
                                class="input input-bordered w-20"
                                @input="
                                    $emit(
                                        'update:groupCountInput',
                                        ($event.target as HTMLInputElement).value,
                                    )
                                "
                                @blur="$emit('commitGroupCount')"
                                @keyup.enter="$emit('commitGroupCount')"
                            />
                        </div>
                        <button @click="$emit('buildGroupsForCount')" class="btn btn-outline">
                            <LucideIcon name="PlusCircle" class="w-4 h-4 mr-2" />建立組別
                        </button>
                        <button @click="$emit('randomAssignGroups')" class="btn btn-primary">
                            <LucideIcon name="Shuffle" class="w-4 h-4 mr-2" />一鍵隨機分組
                        </button>
                        <button @click="$emit('resetAllGroups')" class="btn btn-ghost">
                            <LucideIcon name="Undo2" class="w-4 h-4 mr-2" />一鍵還原
                        </button>
                        <div class="ml-auto flex gap-2">
                            <button
                                @click="$emit('openRewardInfoModal')"
                                class="btn btn-info btn-sm gap-2"
                                type="button"
                            >
                                <LucideIcon name="Sparkles" class="w-4 h-4" />獎勵說明
                            </button>
                            <button
                                @click="$emit('saveGroupEdits')"
                                class="btn btn-success"
                                :disabled="localGroupsLength === 0"
                            >
                                <LucideIcon name="Save" class="w-4 h-4 mr-2" />儲存組別編輯
                            </button>
                            <button @click="$emit('cancelGroupEdits')" class="btn btn-ghost">
                                取消
                            </button>
                        </div>
                    </div>

                    <div v-else class="flex flex-wrap items-center gap-3">
                        <div class="flex items-center gap-2 text-sm text-base-content/70">
                            <span
                                class="badge badge-outline gap-1"
                                title="如需調整請點擊「編輯組別」"
                            >
                                <LucideIcon name="Lock" class="w-4 h-4" />鎖定
                            </span>
                            <span>活動名稱 (選填)</span>
                            <input
                                :value="activityName"
                                type="text"
                                placeholder="例如：第二次分組討論"
                                class="input input-bordered w-60"
                                @input="
                                    $emit(
                                        'update:activityName',
                                        ($event.target as HTMLInputElement).value,
                                    )
                                "
                            />
                        </div>

                        <div class="ml-auto flex items-center gap-2">
                            <button
                                v-if="rewardEnabled"
                                @click="$emit('openRewardInfoModal')"
                                class="btn btn-sm btn-info gap-1"
                                type="button"
                            >
                                <LucideIcon name="Sparkles" class="w-4 h-4" />
                                獎勵說明
                            </button>
                            <button
                                @click="$emit('toggleGroupsCollapsed')"
                                class="btn btn-sm btn-outline gap-1"
                                :disabled="localGroupsLength === 0"
                                :title="groupsCollapsed ? '展開所有組員' : '收合所有組員'"
                            >
                                <LucideIcon
                                    :name="groupsCollapsed ? 'ChevronDown' : 'ChevronUp'"
                                    class="w-4 h-4"
                                />
                                {{ groupsCollapsed ? '展開組員' : '收合組員' }}
                            </button>
                            <button @click="$emit('startGroupEditing')" class="btn btn-outline">
                                <LucideIcon name="SquarePen" class="w-4 h-4 mr-2" />編輯組別
                            </button>
                            <button
                                @click="$emit('startGrouping')"
                                class="btn btn-success gap-2"
                                :disabled="localGroupsLength === 0 || !hasStudentsInGroups"
                            >
                                <LucideIcon name="Play" class="w-4 h-4" />開始分組活動
                            </button>
                        </div>
                    </div>
                </div>
            </template>

            <template v-else>
                <div class="flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="flex items-center gap-2 text-info font-semibold">
                            <LucideIcon name="CircleDot" class="w-5 h-5 animate-pulse" />
                            <span>分組進行中</span>
                        </span>
                        <input
                            :value="activityName"
                            type="text"
                            placeholder="請輸入活動名稱..."
                            class="input input-sm input-bordered w-52"
                            @input="
                                $emit(
                                    'update:activityName',
                                    ($event.target as HTMLInputElement).value,
                                )
                            "
                        />
                    </div>
                    <div class="flex items-center gap-2">
                        <button
                            v-if="rewardEnabled"
                            @click="$emit('openRewardInfoModal')"
                            class="btn btn-sm btn-info gap-1"
                            type="button"
                        >
                            <LucideIcon name="Sparkles" class="w-4 h-4" />獎勵說明
                        </button>
                        <button
                            @click="$emit('toggleGroupsCollapsed')"
                            class="btn btn-sm btn-outline gap-1"
                            :disabled="localGroupsLength === 0"
                            :title="groupsCollapsed ? '展開所有組員' : '收合所有組員'"
                        >
                            <LucideIcon
                                :name="groupsCollapsed ? 'ChevronDown' : 'ChevronUp'"
                                class="w-4 h-4"
                            />
                            {{ groupsCollapsed ? '展開組員' : '收合組員' }}
                        </button>
                        <button
                            @click="$emit('exportActivityReport')"
                            class="btn btn-sm btn-info gap-1"
                            :disabled="!activityName.trim()"
                            title="匯出活動報告"
                        >
                            <LucideIcon name="Download" class="w-4 h-4" />
                            匯出
                        </button>
                        <button
                            @click="$emit('showGroupScoreboard')"
                            class="btn btn-sm btn-warning gap-1"
                            title="顯示積分儀表板"
                        >
                            <LucideIcon name="Trophy" class="w-4 h-4" />
                            儀表板
                        </button>
                        <button @click="$emit('endGrouping')" class="btn btn-sm btn-error gap-1">
                            <LucideIcon name="Square" class="w-4 h-4" />
                            結束分組
                        </button>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import LucideIcon from '~/components/LucideIcon.vue'
defineProps<{
    groupingActive: boolean
    isGroupEditMode: boolean
    groupCountInput: string
    groupCountMin: number
    groupCountMax: number
    localGroupsLength: number
    activityName: string
    hasStudentsInGroups: boolean
    rewardEnabled: boolean
    groupsCollapsed: boolean
}>()

defineEmits<{
    (e: 'update:groupCountInput', value: string): void
    (e: 'commitGroupCount'): void
    (e: 'buildGroupsForCount'): void
    (e: 'randomAssignGroups'): void
    (e: 'resetAllGroups'): void
    (e: 'openRewardInfoModal'): void
    (e: 'saveGroupEdits'): void
    (e: 'cancelGroupEdits'): void
    (e: 'update:activityName', value: string): void
    (e: 'expandAllGroups'): void
    (e: 'collapseAllGroups'): void
    (e: 'toggleGroupsCollapsed'): void
    (e: 'startGroupEditing'): void
    (e: 'startGrouping'): void
    (e: 'exportActivityReport'): void
    (e: 'showGroupScoreboard'): void
    (e: 'endGrouping'): void
}>()
</script>
