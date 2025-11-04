<template>
    <div class="space-y-6">
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
                                            ⭐ 達成無敵：<span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.starsToInvincible
                                                }}
                                                星</span
                                            >
                                        </div>
                                        <div>
                                            💰 每星需求：<span class="font-semibold"
                                                >{{
                                                    selectedTemplate.settings.pointsPerStar
                                                }}
                                                分</span
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

                <!-- 自訂規則 -->
                <label
                    class="cursor-pointer label border rounded-lg p-4 hover:bg-base-200/50 transition-colors"
                    :class="{ 'border-info bg-info/5': localMode === 'custom' }"
                >
                    <div class="flex items-start gap-3 flex-1">
                        <input
                            type="radio"
                            class="radio radio-info"
                            :checked="localMode === 'custom'"
                            @change="localMode = 'custom'"
                        />
                        <div class="flex-1">
                            <span class="label-text font-semibold">自訂規則</span>
                            <p class="text-xs text-base-content/60 mt-1">為此班級單獨設定參數</p>

                            <!-- 自訂參數表單 -->
                            <div v-if="localMode === 'custom'" class="mt-4 space-y-4">
                                <!-- 單項設定 -->
                                <div class="grid grid-cols-3 items-center gap-4">
                                    <div class="col-span-1">
                                        <label class="font-semibold">星星門檻</label>
                                        <p class="text-xs text-base-content/60 mt-1">
                                            達成無敵需幾顆星
                                        </p>
                                    </div>
                                    <div class="col-span-2 join">
                                        <input
                                            v-model.number="customSettings.starsToInvincible"
                                            type="number"
                                            min="1"
                                            class="input input-bordered input-sm join-item w-full"
                                        />
                                        <span class="join-item btn btn-sm">顆</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 items-center gap-4">
                                    <div class="col-span-1">
                                        <label class="font-semibold">得分門檻</label>
                                        <p class="text-xs text-base-content/60 mt-1">
                                            獲得一顆星需幾分
                                        </p>
                                    </div>
                                    <div class="col-span-2 join">
                                        <input
                                            v-model.number="customSettings.pointsPerStar"
                                            type="number"
                                            min="1"
                                            class="input input-bordered input-sm join-item w-full"
                                        />
                                        <span class="join-item btn btn-sm">分</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 items-center gap-4">
                                    <div class="col-span-1">
                                        <label class="font-semibold">無敵時長</label>
                                        <p class="text-xs text-base-content/60 mt-1">
                                            無敵狀態持續時間
                                        </p>
                                    </div>
                                    <div class="col-span-2 flex items-center gap-2">
                                        <div class="flex-1 join">
                                            <input
                                                v-model.number="customDurationMinutes"
                                                type="number"
                                                min="0"
                                                class="input input-bordered input-sm join-item w-full"
                                            />
                                            <span class="join-item btn btn-sm">分</span>
                                        </div>
                                        <div class="flex-1 join">
                                            <input
                                                v-model.number="customDurationSeconds"
                                                type="number"
                                                min="0"
                                                max="59"
                                                class="input input-bordered input-sm join-item w-full"
                                            />
                                            <span class="join-item btn btn-sm">秒</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 items-center gap-4">
                                    <div class="col-span-1">
                                        <label class="font-semibold">無敵加分</label>
                                        <p class="text-xs text-base-content/60 mt-1">
                                            無敵時每次加分值
                                        </p>
                                    </div>
                                    <div class="col-span-2 join">
                                        <input
                                            v-model.number="customSettings.invinciblePointsPerClick"
                                            type="number"
                                            min="1"
                                            class="input input-bordered input-sm join-item w-full"
                                        />
                                        <span class="join-item btn btn-sm">分</span>
                                    </div>
                                </div>

                                <div class="border border-base-300 rounded-lg p-4 space-y-4 bg-base-100">
                                    <div class="flex items-center justify-between gap-3">
                                        <div>
                                            <div class="font-semibold text-sm">星星里程碑提示</div>
                                            <p class="text-xs text-base-content/60 mt-1">
                                                當小組累積星星達到門檻時，自動顯示對應訊息提醒孩子。
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            class="btn btn-xs btn-outline gap-1"
                                            @click="addMilestone"
                                            :disabled="
                                                milestoneMessages.length >=
                                                Math.max(1, customSettings.starsToInvincible)
                                            "
                                        >
                                            <LucideIcon name="Plus" class="w-3.5 h-3.5" />
                                            新增里程碑
                                        </button>
                                    </div>

                                    <div v-if="milestoneValidationError" class="alert alert-warning">
                                        <LucideIcon name="AlertCircle" class="w-4 h-4" />
                                        <span class="text-xs">{{ milestoneValidationError }}</span>
                                    </div>

                                    <div class="flex flex-col gap-3">
                                        <div
                                            v-for="(milestone, index) in milestoneMessages"
                                            :key="`milestone-${index}`"
                                            class="rounded-lg border border-base-200 bg-base-100/80 p-3"
                                        >
                                            <div
                                                class="grid gap-4 items-center md:grid-cols-[auto,1fr,auto] sm:grid-cols-[auto,1fr] grid-cols-1"
                                            >
                                                <div class="flex flex-col gap-1">
                                                    <span class="text-xs font-semibold text-base-content/70">
                                                        達到星星數
                                                    </span>
                                                    <div class="flex items-center gap-2">
                                                        <input
                                                            :value="milestone.threshold"
                                                            type="number"
                                                            class="input input-sm input-bordered w-20 text-center"
                                                            min="1"
                                                            :max="Math.max(1, customSettings.starsToInvincible)"
                                                            @input="
                                                                handleMilestoneThresholdChange(
                                                                    index,
                                                                    ($event.target as HTMLInputElement).valueAsNumber,
                                                                )
                                                            "
                                                        />
                                                        <span class="text-sm text-base-content/60">顆</span>
                                                    </div>
                                                </div>
                                                <div class="flex flex-col gap-1">
                                                    <span class="text-xs font-semibold text-base-content/70">
                                                        提示訊息
                                                    </span>
                                                    <div class="flex items-center gap-2">
                                                        <input
                                                            :value="milestone.message"
                                                            type="text"
                                                            class="input input-sm input-bordered w-full"
                                                            :maxlength="REWARD_MILESTONE_MESSAGE_MAX_LENGTH"
                                                            @input="
                                                                updateMilestoneMessage(
                                                                    index,
                                                                    ($event.target as HTMLInputElement).value || '',
                                                                )
                                                            "
                                                        />
                                                        <span class="text-[10px] text-base-content/50">
                                                            {{ milestone.message.length }}/{{
                                                                REWARD_MILESTONE_MESSAGE_MAX_LENGTH
                                                            }}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="flex items-center justify-end self-stretch">
                                                    <button
                                                        type="button"
                                                        class="btn btn-xs btn-outline btn-error gap-1"
                                                        @click="removeMilestone(index)"
                                                        :disabled="milestoneMessages.length <= 1"
                                                    >
                                                        <LucideIcon name="Trash2" class="w-3.5 h-3.5" />
                                                        移除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>

        <!-- 活動中警告 -->
        <div v-if="classInfo.groupingActive" class="alert alert-warning">
            <LucideIcon name="AlertCircle" class="w-5 h-5" />
            <div class="text-sm">
                <div class="font-semibold">分組活動進行中</div>
                <div class="text-xs mt-1">修改設定將立即生效，可能影響當前活動的獎勵計算。</div>
            </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="flex gap-3 justify-end pt-4 border-t">
            <button @click="$emit('cancel')" class="btn btn-ghost">取消</button>
            <button @click="handleSave" class="btn btn-primary gap-2" :disabled="!canSave">
                <LucideIcon name="Save" class="w-4 h-4" />
                儲存設定
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ClassInfo, RewardTemplate } from '~/types'
import type { RewardSettings, RewardMilestoneMessage } from '~/types/class'
import { useRewardsStore } from '~/stores/rewards'
import {
    buildDefaultMilestoneMessages,
    REWARD_MILESTONE_MESSAGE_MAX_LENGTH,
} from '~/constants/rewards'

interface Props {
    classInfo: ClassInfo
    templates: RewardTemplate[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
    save: [
        config: {
            classId: string
            mode: 'disabled' | 'template' | 'custom'
            templateId?: string | null
            settings?: RewardSettings | null
        },
    ]
    cancel: []
}>()

const rewardsStore = useRewardsStore()

// 本地狀態
const localMode = ref<'disabled' | 'template' | 'custom'>(props.classInfo.rewardSettingsMode)
const selectedTemplateId = ref<string>(props.classInfo.appliedRewardTemplateId || '')
const customSettings = ref<RewardSettings>({
    enabled: true,
    pointsPerStar: 10,
    starsToInvincible: 3,
    invincibleDurationSeconds: 30,
    invinciblePointsPerClick: 5,
    milestoneMessages: buildDefaultMilestoneMessages(3),
})

const customDurationMinutes = computed({
    get: () => Math.floor(customSettings.value.invincibleDurationSeconds / 60),
    set: (value) => {
        const minutes = Math.max(Number(value) || 0, 0)
        const seconds = customSettings.value.invincibleDurationSeconds % 60
        customSettings.value.invincibleDurationSeconds = minutes * 60 + seconds
    },
})

const customDurationSeconds = computed({
    get: () => customSettings.value.invincibleDurationSeconds % 60,
    set: (value) => {
        const seconds = Math.min(Math.max(Number(value) || 0, 0), 59)
        const minutes = Math.floor(customSettings.value.invincibleDurationSeconds / 60)
        customSettings.value.invincibleDurationSeconds = minutes * 60 + seconds
    },
})

// 初始化自訂設定
if (props.classInfo.rewardSettingsMode === 'custom' && props.classInfo.customRewardSettings) {
    customSettings.value = ensureMilestoneArray({ ...props.classInfo.customRewardSettings })
}

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
    if (localMode.value === 'custom') {
        return (
            customSettings.value.pointsPerStar > 0 &&
            customSettings.value.starsToInvincible > 0 &&
            customSettings.value.invincibleDurationSeconds > 0 &&
            customSettings.value.invinciblePointsPerClick > 0 &&
            !milestoneValidationError.value
        )
    }
    return false
})

// 儲存
const handleSave = () => {
    if (!canSave.value) return

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
    } else if (localMode.value === 'custom') {
        const normalized = rewardsStore.normalizeRewardSettings({
            ...customSettings.value,
            milestoneMessages: customSettings.value.milestoneMessages,
        })
        customSettings.value = { ...normalized }
        emit('save', {
            classId: props.classInfo.id,
            mode: 'custom',
            settings: normalized,
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

function ensureMilestoneArray(settings: RewardSettings): RewardSettings {
    const threshold = Math.max(1, Math.floor(settings.starsToInvincible || 1))
    const messages = Array.isArray(settings.milestoneMessages)
        ? settings.milestoneMessages
        : buildDefaultMilestoneMessages(threshold)

    const sanitized = messages
        .map((item) => {
            const thresholdValue = Math.min(
                threshold,
                Math.max(1, Math.floor(Number(item?.threshold) || 0)),
            )
            const messageValue =
                typeof item?.message === 'string'
                    ? item.message.trim().slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH)
                    : ''
            return { threshold: thresholdValue, message: messageValue }
        })
        .sort((a, b) => a.threshold - b.threshold)

    const deduped: RewardMilestoneMessage[] = []
    const tracker = new Map<number, number>()
    sanitized.forEach((item) => {
        if (tracker.has(item.threshold)) {
            const index = tracker.get(item.threshold)!
            deduped[index] = item
        } else {
            tracker.set(item.threshold, deduped.length)
            deduped.push(item)
        }
    })

    if (!tracker.has(threshold)) {
        deduped.push({
            threshold,
            message: '衝刺無敵星星！'.slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH),
        })
    }

    settings.milestoneMessages = deduped
    return settings
}

const milestoneMessages = computed({
    get: () => ensureMilestoneArray(customSettings.value).milestoneMessages ?? [],
    set: (messages: RewardMilestoneMessage[]) => {
        customSettings.value.milestoneMessages = messages
    },
})

const addMilestone = () => {
    const maxThreshold = Math.max(1, customSettings.value.starsToInvincible)
    const current = milestoneMessages.value
    const used = new Set(current.map((item) => item.threshold))

    let candidate = 1
    while (candidate <= maxThreshold && used.has(candidate)) {
        candidate++
    }

    if (candidate > maxThreshold) {
        return
    }

    milestoneMessages.value = [
        ...current,
        {
            threshold: candidate,
            message: '新的里程碑訊息',
        },
    ].sort((a, b) => a.threshold - b.threshold)
}

const removeMilestone = (index: number) => {
    if (milestoneMessages.value.length <= 1) return
    const cloned = [...milestoneMessages.value]
    cloned.splice(index, 1)
    milestoneMessages.value = cloned
}

const handleMilestoneThresholdChange = (index: number, value: number) => {
    const maxThreshold = Math.max(1, customSettings.value.starsToInvincible)
    const sanitizedThreshold = Math.min(
        maxThreshold,
        Math.max(1, Math.floor(Number(value) || 0)),
    )
    const cloned = [...milestoneMessages.value]
    cloned[index] = {
        ...cloned[index],
        threshold: sanitizedThreshold,
    }
    milestoneMessages.value = cloned.sort((a, b) => a.threshold - b.threshold)
}

const updateMilestoneMessage = (index: number, value: string) => {
    const sanitized = (value || '').slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH)
    const cloned = [...milestoneMessages.value]
    cloned[index] = {
        ...cloned[index],
        message: sanitized,
    }
    milestoneMessages.value = cloned
}

const milestoneValidationError = computed(() => {
    const threshold = Math.max(1, customSettings.value.starsToInvincible || 1)
    const messages = milestoneMessages.value
    if (!messages.length) {
        return '請至少建立一個里程碑訊息'
    }
    for (const item of messages) {
        if (!item.message?.trim()) {
            return '里程碑訊息內容不能為空'
        }
        if (item.message.length > REWARD_MILESTONE_MESSAGE_MAX_LENGTH) {
            return `里程碑訊息最多 ${REWARD_MILESTONE_MESSAGE_MAX_LENGTH} 個字`
        }
        if (item.threshold < 1 || item.threshold > threshold) {
            return `里程碑門檻必須介於 1 到 ${threshold}`
        }
    }
    return null
})

watch(
    () => customSettings.value.starsToInvincible,
    () => {
        milestoneMessages.value = ensureMilestoneArray(customSettings.value).milestoneMessages ?? []
    },
)
</script>
