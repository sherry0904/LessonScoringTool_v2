<template>
    <div class="space-y-6">
        <!-- 活動中警告 - 放在最頂部 -->
        <div v-if="classInfo.groupingActive" class="alert alert-warning">
            <LucideIcon name="AlertCircle" class="w-5 h-5" />
            <div class="text-sm space-y-2">
                <div class="font-semibold">⚠️ 分組活動進行中</div>
                <div class="text-xs">
                    新設定將套用到「新增的分數」上。已經收集到的星星數<span class="font-semibold">
                        不會重新計算
                    </span>
                    。
                </div>
                <div class="text-xs mt-2">
                    例如：若從「20分/星」改為「3分/星」，之前的星星保留不變，只有新加的分數按新規則計算。
                </div>
            </div>
        </div>

        <!-- 模式選擇 -->
        <div class="form-control">
            <label class="label">
                <span class="label-text font-semibold">獎勵模式</span>
            </label>
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
                            <p class="text-xs text-base-content/60 mt-1">不使用任何獎勵機制</p>
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
                            <p class="text-xs text-base-content/60 mt-1">從預設範本中選擇</p>

                            <!-- 範本選擇 -->
                            <div v-if="localMode === 'template'" class="mt-3">
                                <select
                                    v-model="selectedTemplateId"
                                    class="select select-bordered select-sm w-full"
                                >
                                    <option value="">-- 請選擇範本 --</option>
                                    <option
                                        v-for="template in templates"
                                        :key="template.id"
                                        :value="template.id"
                                    >
                                        {{ template.name }}
                                        <span v-if="template.isDefault"> (預設)</span>
                                    </option>
                                </select>

                                <!-- 範本預覽 -->
                                <div
                                    v-if="selectedTemplate"
                                    class="mt-3 p-3 bg-base-200/50 rounded-lg text-xs space-y-1"
                                >
                                    <div class="font-semibold mb-2">範本設定預覽：</div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <div>
                                            💰 每星需求：<span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.pointsPerStar
                                                }}
                                                分</span
                                            >
                                        </div>
                                        <div>
                                            ⭐ 達成無敵：<span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.starsToInvincible
                                                }}
                                                星</span
                                            >
                                        </div>
                                        <div>
                                            ⏱️ 無敵時長：<span class="font-semibold">{{
                                                formatDuration(
                                                    selectedTemplate.settings
                                                        .invincibleDurationSeconds,
                                                )
                                            }}</span>
                                        </div>
                                        <div>
                                            🎯 無敵加分：<span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings
                                                        .invinciblePointsPerClick
                                                }}
                                                分/次</span
                                            >
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

// 選中的範本
const selectedTemplate = computed(() => {
    if (!selectedTemplateId.value) return null
    return rewardsStore.getTemplateById(selectedTemplateId.value)
})

const formatDuration = (seconds: number) => {
    const totalSeconds = Math.max(Number(seconds) || 0, 0)
    const minutes = Math.floor(totalSeconds / 60)
    const remainSeconds = totalSeconds % 60
    return `${minutes} 分 ${remainSeconds} 秒`
}

// 是否可以儲存
const canSave = computed(() => {
    if (localMode.value === 'disabled') return true
    if (localMode.value === 'template') return !!selectedTemplateId.value
    return false
})

// 重設為預設
const resetToDefault = () => {
    if (confirm('確定要重設為預設獎勵機制嗎？當前的自訂設定將被清除。')) {
        const defaultTemplate = props.templates.find((t) => t.isDefault)
        if (defaultTemplate) {
            localMode.value = 'template'
            selectedTemplateId.value = defaultTemplate.id
        } else {
            localMode.value = 'disabled'
        }
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

// 當切換到 template 模式時，如果沒有選擇範本，自動選擇預設範本
watch(localMode, (newMode) => {
    if (newMode === 'template' && !selectedTemplateId.value) {
        const defaultTemplate = props.templates.find((t) => t.isDefault)
        if (defaultTemplate) {
            selectedTemplateId.value = defaultTemplate.id
        } else if (props.templates.length > 0) {
            selectedTemplateId.value = props.templates[0].id
        }
    }
})
</script>
