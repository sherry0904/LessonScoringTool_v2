<template>
    <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box w-full max-w-md">
            <h2 class="modal-title text-lg font-bold mb-6">
                {{ isCreatingNew ? '建立新範本' : '編輯範本' }}
            </h2>

            <!-- 警告：範本被分組班級使用中 -->
            <div v-if="shouldShowTemplateWarning" class="alert alert-warning gap-3 mb-6">
                <LucideIcon name="AlertTriangle" class="w-5 h-5 flex-shrink-0" />
                <div class="flex-1">
                    <div class="text-sm font-semibold leading-tight">
                        ⚠️ 此範本正被 {{ activeGroupingClassesUsingTemplate.length }} 個班級使用中
                    </div>
                    <div class="text-xs text-warning/80 mt-1 leading-relaxed">
                        <div>受影響班級：</div>
                        <ul class="list-disc list-inside ml-1">
                            <li v-for="cls in activeGroupingClassesUsingTemplate" :key="cls.id">
                                {{ cls.name }}
                            </li>
                        </ul>
                        <div class="mt-1.5">
                            新的設定會立即應用到未來的得分，但已收集的星星不會被重新計算。
                        </div>
                    </div>
                </div>
            </div>

            <!-- 基本資訊區塊 -->
            <div class="space-y-6">
                <!-- 範本名稱 -->
                <div class="form-control">
                    <label class="label pb-2">
                        <span class="label-text font-semibold text-base text-black">範本名稱</span>
                        <span class="label-text-alt text-xs text-base-content text-black"
                            >用於識別這個範本</span
                        >
                    </label>
                    <input
                        v-model="template.name"
                        type="text"
                        placeholder="例：基礎獎勵、激勵模式"
                        class="input input-bordered focus:input-primary"
                    />
                </div>

                <!-- 分隔線 -->
                <div class="divider my-2"></div>

                <!-- 獎勵參數區塊 -->
                <div class="bg-base-200/30 px-4 py-4 rounded-lg space-y-4">
                    <div class="font-semibold text-sm text-base-content/80 -mx-4 px-4">
                        <LucideIcon name="Settings2" class="w-4 h-4 inline mr-2" />
                        獎勵參數設定
                    </div>

                    <!-- 模式選擇 -->
                    <div class="form-control -mx-4 px-4">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm text-black">獎勵模式</span>
                            <span class="label-text-alt text-xs text-black">
                                {{ isCreatingNew ? '選擇模式類型' : '無法修改' }}
                            </span>
                        </label>
                        <select
                            v-model="template.settings.mode"
                            class="select select-sm select-bordered focus:select-primary"
                            :disabled="!isCreatingNew"
                        >
                            <option value="class-total">全班協作模式</option>
                            <option value="group-based">各組獨立模式</option>
                        </select>
                    </div>

                    <!-- 全班協作模式參數 -->
                    <template v-if="template.settings.mode === 'class-total'">
                        <!-- 全班目標分數 -->
                        <div class="form-control -mx-4 px-4">
                            <label class="label pb-1.5">
                                <span class="label-text text-sm text-black">全班目標分數</span>
                                <span class="label-text-alt text-xs text-black"
                                    >達到此分數變無敵</span
                                >
                            </label>
                            <input
                                v-model.number="template.settings.classTotalTargetPoints"
                                type="number"
                                min="1"
                                class="input input-sm input-bordered focus:input-primary"
                            />
                        </div>
                    </template>

                    <!-- 各組獨立模式參數 -->
                    <template v-else-if="template.settings.mode === 'group-based'">
                        <!-- 得分門檻 -->
                        <div class="form-control -mx-4 px-4">
                            <label class="label pb-1.5">
                                <span class="label-text text-sm text-black">得分門檻</span>
                                <span class="label-text-alt text-xs text-black">多少分一顆星</span>
                            </label>
                            <input
                                v-model.number="template.settings.pointsPerStar"
                                type="number"
                                min="1"
                                class="input input-sm input-bordered focus:input-primary"
                            />
                        </div>

                        <!-- 星星門檻 -->
                        <div class="form-control -mx-4 px-4">
                            <label class="label pb-1.5">
                                <span class="label-text text-sm text-black">星星門檻</span>
                                <span class="label-text-alt text-xs text-black">幾顆星變無敵</span>
                            </label>
                            <input
                                v-model.number="template.settings.starsToInvincible"
                                type="number"
                                min="1"
                                class="input input-sm input-bordered focus:input-primary"
                            />
                        </div>
                    </template>

                    <!-- 無敵時間 -->
                    <div class="form-control -mx-4 px-4">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm text-black">無敵持續時間</span>
                            <span class="label-text-alt text-xs text-black">分鐘 : 秒</span>
                        </label>
                        <div class="flex gap-2 items-center">
                            <div class="flex-1">
                                <input
                                    v-model.number="durationMinutes"
                                    type="number"
                                    placeholder="分"
                                    min="0"
                                    max="60"
                                    class="input input-sm input-bordered focus:input-primary w-full"
                                />
                            </div>
                            <span class="text-base-content/60">:</span>
                            <div class="flex-1">
                                <input
                                    v-model.number="durationSeconds"
                                    type="number"
                                    placeholder="秒"
                                    min="0"
                                    max="59"
                                    class="input input-sm input-bordered focus:input-primary w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- 無敵加分值 -->
                    <div class="form-control -mx-4 px-4">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm text-black">無敵加分值</span>
                            <span class="label-text-alt text-xs text-black">無敵時每次加幾分</span>
                        </label>
                        <input
                            v-model.number.lazy="template.settings.invinciblePointsPerClick"
                            type="number"
                            min="1"
                            class="input input-sm input-bordered focus:input-primary"
                        />
                    </div>

                    <!-- 里程碑訊息（僅各組獨立模式） -->
                    <div
                        v-if="template.settings.mode === 'group-based'"
                        class="border border-base-200 rounded-lg bg-base-100 px-4 py-4 space-y-4"
                    >
                        <div class="flex items-center justify-between gap-3 -mx-4 px-4">
                            <div>
                                <div class="font-semibold text-sm">星星里程碑提示</div>
                                <p class="text-xs text-base-content/60 mt-1">
                                    自訂不同星星門檻達成時要顯示的提醒內容。
                                    <span class="text-warning"
                                        >里程碑不可設在無敵星星門檻，因為會被恭喜動畫遮擋。</span
                                    >
                                </p>
                            </div>
                            <button
                                type="button"
                                class="btn btn-xs btn-outline gap-1"
                                @click="addMilestone"
                                :disabled="
                                    milestoneMessages.length >=
                                    Math.max(1, template.settings.starsToInvincible - 1)
                                "
                            >
                                <LucideIcon name="Plus" class="w-3.5 h-3.5" />
                                新增里程碑
                            </button>
                        </div>

                        <div v-if="milestoneValidationError" class="alert alert-warning -mx-4 px-4">
                            <LucideIcon name="AlertCircle" class="w-4 h-4" />
                            <span class="text-xs">{{ milestoneValidationError }}</span>
                        </div>

                        <div class="flex flex-col gap-3 -mx-4 px-4">
                            <div
                                v-for="(milestone, index) in milestoneMessages"
                                :key="`template-milestone-${index}`"
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
                                                :max="
                                                    Math.max(
                                                        1,
                                                        template.settings.starsToInvincible - 1,
                                                    )
                                                "
                                                @input="
                                                    handleMilestoneThresholdChange(
                                                        index,
                                                        ($event.target as HTMLInputElement)
                                                            .valueAsNumber,
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
                                                        ($event.target as HTMLInputElement).value ||
                                                            '',
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

            <!-- 操作按鈕 -->
            <div class="modal-action mt-8">
                <button @click="handleCancel" class="btn btn-outline">
                    <LucideIcon name="X" class="w-4 h-4" />
                    取消
                </button>
                <button @click="handleSave" class="btn btn-success">
                    <LucideIcon name="Check" class="w-4 h-4" />
                    儲存
                </button>
            </div>
        </div>

        <!-- 半透明背景，點擊關閉 -->
        <form method="dialog" class="modal-backdrop">
            <button></button>
        </form>
    </dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { RewardTemplate } from '~/types'
import type { RewardSettings, RewardMilestoneMessage } from '~/types/class'
import { useClassesStore } from '~/stores/classes'
import LucideIcon from './LucideIcon.vue'
import {
    buildDefaultMilestoneMessages,
    REWARD_MILESTONE_MESSAGE_MAX_LENGTH,
} from '~/constants/rewards'

interface Props {
    initialTemplate?: RewardTemplate | null
    isCreatingNew?: boolean
    defaultSettings?: RewardSettings
}

const props = withDefaults(defineProps<Props>(), {
    initialTemplate: null,
    isCreatingNew: false,
    defaultSettings: undefined,
})

const emit = defineEmits<{
    save: [template: RewardTemplate, isNew: boolean]
    cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const isCreatingNew = ref(props.isCreatingNew)

// 取得預設設定
const getDefaultSettings = (): RewardSettings => {
    if (props.defaultSettings) {
        return JSON.parse(JSON.stringify(props.defaultSettings))
    }
    // 預設為 group-based 模式（向後相容）
    return {
        enabled: true,
        mode: 'group-based',
        pointsPerStar: 10,
        starsToInvincible: 3,
        invincibleDurationSeconds: 600,
        invinciblePointsPerClick: 2,
        milestoneMessages: buildDefaultMilestoneMessages(3),
    }
}

// 初始化範本資料
const template = reactive<RewardTemplate>({
    id: '',
    name: '新的獎勵範本',
    settings: getDefaultSettings(),
    isDefault: false,
})

// 取得 classesStore
const classesStore = useClassesStore()

// 計算屬性：檢查哪些班級正在使用該範本且處於分組狀態
const activeGroupingClassesUsingTemplate = computed(() => {
    if (isCreatingNew.value || !template.id) {
        return []
    }

    // 遍歷所有班級，找出符合條件的班級
    const matchingClasses: Array<{ id: string; name: string }> = []

    classesStore.classes.forEach((classData) => {
        // 檢查是否使用該範本且處於分組狀態
        if (
            classData.rewardSettingsMode === 'template' &&
            classData.appliedRewardTemplateId === template.id &&
            classData.groupingActive
        ) {
            matchingClasses.push({
                id: classData.id,
                name: classData.name,
            })
        }
    })

    return matchingClasses
})

// 計算屬性：是否應顯示警告
const shouldShowTemplateWarning = computed(() => {
    return activeGroupingClassesUsingTemplate.value.length > 0
})

// 分鐘和秒的計算（僅 UI 用）
const durationMinutes = ref<number>(10)
const durationSeconds = ref<number>(0)

// 監聽 props 變化，更新 template
const ensureMilestones = (settings: RewardSettings): RewardSettings => {
    const threshold = Math.max(1, Math.floor(settings.starsToInvincible || 1))
    const baseMessages = Array.isArray(settings.milestoneMessages) ? settings.milestoneMessages : []

    const sanitized = baseMessages
        .map((item) => {
            const t = Math.min(threshold, Math.max(1, Math.floor(Number(item?.threshold) || 0)))
            const message =
                typeof item?.message === 'string'
                    ? item.message.trim().slice(0, REWARD_MILESTONE_MESSAGE_MAX_LENGTH)
                    : ''
            return { threshold: t, message }
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

    settings.milestoneMessages = deduped
    return settings
}

const milestoneMessages = computed({
    get: () => ensureMilestones(template.settings).milestoneMessages ?? [],
    set: (messages: RewardMilestoneMessage[]) => {
        template.settings.milestoneMessages = messages
    },
})

const milestoneValidationError = computed(() => {
    const threshold = Math.max(1, template.settings.starsToInvincible || 1)
    const messages = milestoneMessages.value
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

const addMilestone = () => {
    const maxThreshold = Math.max(1, template.settings.starsToInvincible || 1)
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
        { threshold: candidate, message: '新的里程碑訊息' },
    ].sort((a, b) => a.threshold - b.threshold)
}

const removeMilestone = (index: number) => {
    const cloned = [...milestoneMessages.value]
    cloned.splice(index, 1)
    milestoneMessages.value = cloned
}

const handleMilestoneThresholdChange = (index: number, value: number) => {
    const maxThreshold = Math.max(1, template.settings.starsToInvincible || 1)
    const sanitizedThreshold = Math.min(maxThreshold, Math.max(1, Math.floor(Number(value) || 0)))
    const cloned = [...milestoneMessages.value]
    cloned[index] = { ...cloned[index], threshold: sanitizedThreshold }
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

watch(
    () => props.initialTemplate,
    (newTemplate) => {
        if (newTemplate) {
            const data = JSON.parse(JSON.stringify(newTemplate))
            template.id = data.id
            template.name = data.name
            template.settings = ensureMilestones(data.settings)
            template.isDefault = false // 不再使用 isDefault
        } else {
            // 重設為新範本時，使用 defaultSettings
            template.id = ''
            template.name = '新的獎勵範本'
            template.settings = ensureMilestones(getDefaultSettings())
            template.isDefault = false
        }
    },
    { deep: true },
)

// 當父層提供的 defaultSettings 改變時（例如切換 Tab），同步更新新建範本設定
watch(
    () => props.defaultSettings,
    () => {
        if (isCreatingNew.value && !props.initialTemplate) {
            template.settings = ensureMilestones(getDefaultSettings())
        }
    },
    { deep: true },
)

// 監聽 isCreatingNew prop
watch(
    () => props.isCreatingNew,
    (newValue) => {
        isCreatingNew.value = newValue
    },
)

// 初始化時，從秒數轉換為分鐘和秒
watch(
    () => template.settings.invincibleDurationSeconds,
    (newValue) => {
        if (typeof newValue === 'number') {
            durationMinutes.value = Math.floor(newValue / 60)
            durationSeconds.value = newValue % 60
        }
    },
    { immediate: true },
)

// 當分鐘或秒變化時，更新總秒數
watch([durationMinutes, durationSeconds], ([minutes, seconds]) => {
    if (typeof minutes === 'number' && typeof seconds === 'number') {
        // 確保秒數在 0-59 之間
        const validSeconds = Math.min(Math.max(seconds, 0), 59)
        if (validSeconds !== seconds) {
            durationSeconds.value = validSeconds
        }

        // 轉換為總秒數存儲
        const totalSeconds = minutes * 60 + validSeconds
        if (totalSeconds > 0) {
            template.settings.invincibleDurationSeconds = totalSeconds
        }
    }
})

watch(
    () => template.settings.starsToInvincible,
    () => {
        milestoneMessages.value = ensureMilestones(template.settings).milestoneMessages ?? []
    },
)

// 監聽模式變化，確保全班協作模式有正確的 classTotalTargetPoints
watch(
    () => template.settings.mode,
    (newMode) => {
        if (newMode === 'class-total') {
            // 如果切換到全班協作模式且沒有 classTotalTargetPoints，設定預設值
            if (!template.settings.classTotalTargetPoints) {
                template.settings.classTotalTargetPoints = 200
            }
        }
    },
)

/**
 * 打開 Modal
 */
const open = (overrideSettings?: RewardSettings) => {
    // 如果是新建範本，使用最新的 defaultSettings 重新初始化
    if (isCreatingNew.value && !props.initialTemplate) {
        template.id = ''
        template.name = '新的獎勵範本'
        if (overrideSettings) {
            template.settings = ensureMilestones(JSON.parse(JSON.stringify(overrideSettings)))
        } else {
            template.settings = ensureMilestones(getDefaultSettings())
        }
        template.isDefault = false
    }
    if (dialogRef.value) {
        dialogRef.value.showModal()
    }
}

/**
 * 關閉 Modal
 */
const close = () => {
    if (dialogRef.value) {
        dialogRef.value.close()
    }
}

/**
 * 保存範本
 */
const handleSave = () => {
    if (milestoneValidationError.value) {
        alert(milestoneValidationError.value)
        return
    }
    ensureMilestones(template.settings)
    emit('save', template, isCreatingNew.value)
    close()
}

/**
 * 取消
 */
const handleCancel = () => {
    emit('cancel')
    close()
}

// 暴露方法給父元件
defineExpose({
    open,
    close,
})
</script>
