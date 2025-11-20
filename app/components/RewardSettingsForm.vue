<template>
    <div class="space-y-6">
        <!-- 活動中警告 - 根據模式顯示不同內容 -->
        <div v-if="classInfo.groupingActive" class="alert alert-warning">
            <LucideIcon name="AlertCircle" class="w-5 h-5 flex-shrink-0" />
            <div class="text-sm">
                <div class="font-semibold">⚠️ 分組活動進行中</div>
                <div class="text-xs mt-1">
                    <template v-if="selectedTemplate?.settings.mode === 'class-total'">
                        新設定將套用到新增的分數。已收集的總分不會重新計算。
                    </template>
                    <template v-else>
                        新設定將套用到新增的分數。已收集的星星數不會重新計算。
                    </template>
                </div>
            </div>
        </div>

        <!-- 模式選擇 -->
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">獎勵模式</span>
            </label>

            <!-- 模式 Tab -->
            <div
                class="flex flex-wrap items-center gap-2 bg-base-200/70 p-1.5 rounded-2xl mb-4"
                role="tablist"
                aria-label="獎勵模式切換"
            >
                <button
                    type="button"
                    role="tab"
                    :aria-selected="selectedModeTab === 'class-total'"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                    :class="{
                        'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                            selectedModeTab === 'class-total',
                        'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                            selectedModeTab !== 'class-total',
                    }"
                    @click="selectedModeTab = 'class-total'"
                >
                    <LucideIcon name="Users" class="w-4 h-4" />
                    <span>全班協作模式</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    :aria-selected="selectedModeTab === 'group-based'"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
                    :class="{
                        'bg-base-100 text-primary shadow-[0_6px_18px_rgba(25,39,85,0.15)] border-primary/20':
                            selectedModeTab === 'group-based',
                        'text-base-content/60 hover:text-base-content hover:bg-base-100/70':
                            selectedModeTab !== 'group-based',
                    }"
                    @click="selectedModeTab = 'group-based'"
                >
                    <LucideIcon name="Trophy" class="w-4 h-4" />
                    <span>各組獨立模式</span>
                </button>
            </div>

            <div class="flex flex-col gap-3">
                <!-- 停用 -->
                <label
                    class="cursor-pointer label border rounded-lg p-4 hover:bg-base-200/50 transition-colors"
                    :class="{ 'border-error bg-error/5': localMode === 'disabled' }"
                >
                    <div class="flex items-start gap-3 flex-1">
                        <input
                            type="radio"
                            class="radio radio-error"
                            :checked="localMode === 'disabled'"
                            @change="localMode = 'disabled'"
                        />
                        <div class="flex-1">
                            <span class="label-text font-semibold">停用獎勵機制</span>
                            <p class="text-xs text-base-content mt-1">不使用任何獎勵機制</p>
                        </div>
                    </div>
                </label>

                <!-- 套用範本 -->
                <label
                    class="cursor-pointer label border rounded-lg p-4 hover:bg-base-200/50 transition-colors"
                    :class="{ 'border-success bg-success/5': localMode === 'template' }"
                >
                    <div class="flex items-start gap-3 flex-1">
                        <input
                            type="radio"
                            class="radio radio-success"
                            :checked="localMode === 'template'"
                            @change="localMode = 'template'"
                        />
                        <div class="flex-1">
                            <span class="label-text font-semibold">使用範本</span>
                            <p class="text-xs text-base-content mt-1">從預設範本中選擇</p>

                            <div v-if="localMode === 'template'" class="mt-3">
                                <select
                                    v-model="selectedTemplateId"
                                    class="select select-bordered select-sm w-full text-base-content font-medium"
                                >
                                    <option value="" class="text-base-content">
                                        -- 請選擇範本 --
                                    </option>
                                    <option
                                        v-for="template in filteredTemplates"
                                        :key="template.id"
                                        :value="template.id"
                                        class="text-base-content"
                                    >
                                        {{ template.name }}
                                    </option>
                                </select>

                                <div
                                    v-if="selectedTemplate"
                                    class="mt-3 p-3 bg-base-200/50 rounded-lg text-xs"
                                >
                                    <div class="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <LucideIcon name="Info" class="w-4 h-4" />
                                        設定預覽
                                    </div>

                                    <div
                                        v-if="selectedTemplate.settings.mode === 'group-based'"
                                        class="grid grid-cols-2 gap-x-4 gap-y-2"
                                    >
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">💰 每星</span>
                                            <span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.pointsPerStar
                                                }}分</span
                                            >
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">⭐ 無敵</span>
                                            <span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.starsToInvincible
                                                }}星</span
                                            >
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">⏱️ 時長</span>
                                            <span class="font-semibold">{{
                                                formatDurationDisplay(
                                                    selectedTemplate.settings
                                                        .invincibleDurationSeconds,
                                                )
                                            }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">🎯 加分</span>
                                            <span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings
                                                        .invinciblePointsPerClick
                                                }}分/次</span
                                            >
                                        </div>
                                    </div>

                                    <div
                                        v-else-if="selectedTemplate.settings.mode === 'class-total'"
                                        class="grid grid-cols-2 gap-x-4 gap-y-2"
                                    >
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">🎯 全班目標</span>
                                            <span class="font-semibold">
                                                {{
                                                    selectedTemplate.settings
                                                        .classTotalTargetPoints ??
                                                    selectedTemplate.settings.classTotalMode
                                                        ?.pointsPerInvincible
                                                }}分
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">⏱️ 無敵時長</span>
                                            <span class="font-semibold">
                                                {{
                                                    formatDurationDisplay(
                                                        selectedTemplate.settings
                                                            .invincibleDurationSeconds ??
                                                            selectedTemplate.settings.classTotalMode
                                                                ?.invincibleDurationSeconds,
                                                    )
                                                }}
                                            </span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-base-content">💎 無敵加分</span>
                                            <span class="font-semibold">
                                                {{
                                                    selectedTemplate.settings
                                                        .invinciblePointsPerClick ??
                                                    selectedTemplate.settings.classTotalMode
                                                        ?.invinciblePointsPerClick
                                                }}分/次
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex gap-3 justify-between pt-4 border-t">
            <div></div>
            <div class="flex gap-3">
                <button @click="$emit('cancel')" class="btn btn-ghost">取消</button>
                <button @click="handleSave" class="btn btn-primary gap-2" :disabled="!canSave">
                    <LucideIcon name="Save" class="w-4 h-4" />
                    儲存設定
                </button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ClassInfo, RewardTemplate } from '~/types'
import { useRewardsStore } from '~/stores/rewards'
import { formatDurationDisplay } from '~/constants/rewards'

interface Props {
    classInfo: ClassInfo
    templates: RewardTemplate[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    save: [
        config: {
            classId: string
            mode: 'disabled' | 'template'
            templateId?: string | null
        },
    ]
    cancel: []
}>()

// 調試：監控 groupingActive
watch(
    () => props.classInfo.groupingActive,
    (newVal) => {
        console.log(
            `🎯 RewardSettingsForm: classInfo.groupingActive = ${newVal}, classId = ${props.classInfo.id}`,
        )
    },
    { immediate: true },
)

const rewardsStore = useRewardsStore()

// 本地狀態
const localMode = ref<'disabled' | 'template'>(
    props.classInfo.rewardSettingsMode === 'custom'
        ? 'disabled'
        : props.classInfo.rewardSettingsMode || 'disabled',
)
const selectedTemplateId = ref<string>(props.classInfo.appliedRewardTemplateId || '')

// 模式類型 Tab（新增）
// 預設為 class-total（全班協作模式優先顯示）
const selectedModeTab = ref<'group-based' | 'class-total'>('class-total')

// 根據目前選擇的範本，自動設定 Tab
if (selectedTemplateId.value) {
    const currentTemplate = rewardsStore.getTemplateById(selectedTemplateId.value)
    if (currentTemplate?.settings.mode) {
        selectedModeTab.value = currentTemplate.settings.mode
    }
}

// 根據 Tab 篩選範本
const filteredTemplates = computed(() => {
    return props.templates.filter((template) => template.settings.mode === selectedModeTab.value)
})

// 選中的範本
const selectedTemplate = computed(() => {
    if (!selectedTemplateId.value) return null
    return rewardsStore.getTemplateById(selectedTemplateId.value)
})

// 是否可以儲存
const canSave = computed(() => {
    if (localMode.value === 'disabled') return true
    if (localMode.value === 'template') return !!selectedTemplateId.value
    return false
})

// 重設為停用
const resetToDefault = () => {
    if (confirm('確定要停用獎勵機制嗎？')) {
        localMode.value = 'disabled'
        selectedTemplateId.value = ''
    }
}

// 儲存
const handleSave = () => {
    if (!canSave.value) {
        return
    }

    // 保存設定
    if (localMode.value === 'disabled') {
        emit('save', {
            classId: props.classInfo.id,
            mode: 'disabled',
        })
    } else if (localMode.value === 'template') {
        emit('save', {
            classId: props.classInfo.id,
            mode: 'template',
            templateId: selectedTemplateId.value,
        })
    }
}

// 當切換到 template 模式時，如果沒有選擇範本，自動選擇第一個範本
watch(localMode, (newMode) => {
    if (newMode === 'template' && !selectedTemplateId.value) {
        if (filteredTemplates.value.length > 0) {
            selectedTemplateId.value = filteredTemplates.value[0].id
        }
    }
})

// 當切換 Tab 時，自動選擇該 Tab 的第一個範本
watch(selectedModeTab, () => {
    if (localMode.value === 'template') {
        // 檢查目前選擇的範本是否屬於新的 Tab
        const currentTemplate = selectedTemplate.value
        if (currentTemplate && currentTemplate.settings.mode !== selectedModeTab.value) {
            // 自動選擇新 Tab 的第一個範本
            if (filteredTemplates.value.length > 0) {
                selectedTemplateId.value = filteredTemplates.value[0].id
            } else {
                selectedTemplateId.value = ''
            }
        }
    }
})
</script>

<style scoped>
select {
    color: hsl(var(--bc));
}

select option {
    color: hsl(var(--bc));
}

select option:checked,
select option:focus,
select option:hover {
    background-color: hsl(var(--p) / 0.18);
    color: hsl(var(--bc));
}
</style>
