<template>
    <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box w-full max-w-md">
            <h2 class="modal-title text-lg font-bold mb-6">
                {{ isCreatingNew ? '建立新範本' : '編輯範本' }}
            </h2>

            <!-- 基本資訊區塊 -->
            <div class="space-y-6">
                <!-- 範本名稱 -->
                <div class="form-control">
                    <label class="label pb-2">
                        <span class="label-text font-semibold text-base">範本名稱</span>
                        <span class="label-text-alt text-xs text-base-content/60"
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
                <div class="bg-base-200/30 p-4 rounded-lg space-y-4">
                    <div class="font-semibold text-sm text-base-content/80">
                        <LucideIcon name="Settings2" class="w-4 h-4 inline mr-2" />
                        獎勵參數設定
                    </div>

                    <!-- 得分門檻 -->
                    <div class="form-control">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm">得分門檻</span>
                            <span class="label-text-alt text-xs">多少分一顆星</span>
                        </label>
                        <input
                            v-model.number="template.settings.pointsPerStar"
                            type="number"
                            class="input input-sm input-bordered focus:input-primary"
                        />
                    </div>

                    <!-- 星星門檻 -->
                    <div class="form-control">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm">星星門檻</span>
                            <span class="label-text-alt text-xs">幾顆星變無敵</span>
                        </label>
                        <input
                            v-model.number="template.settings.starsToInvincible"
                            type="number"
                            class="input input-sm input-bordered focus:input-primary"
                        />
                    </div>

                    <!-- 無敵時間 -->
                    <div class="form-control">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm">無敵持續時間</span>
                            <span class="label-text-alt text-xs">分鐘 : 秒</span>
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
                    <div class="form-control">
                        <label class="label pb-1.5">
                            <span class="label-text text-sm">無敵加分值</span>
                            <span class="label-text-alt text-xs">無敵時每次加幾分</span>
                        </label>
                        <input
                            v-model.number.lazy="template.settings.invinciblePointsPerClick"
                            type="number"
                            class="input input-sm input-bordered focus:input-primary"
                        />
                    </div>

                    <!-- 里程碑訊息 -->
                    <div class="border border-base-200 rounded-lg bg-base-100 p-4 space-y-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold text-sm">星星里程碑提示</div>
                                <p class="text-xs text-base-content/60 mt-1">
                                    自訂不同星星門檻達成時要顯示的提醒內容。
                                </p>
                            </div>
                            <button
                                type="button"
                                class="btn btn-xs btn-outline gap-1"
                                @click="addMilestone"
                                :disabled="
                                    milestoneMessages.length >=
                                    Math.max(1, template.settings.starsToInvincible)
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
                                                    Math.max(1, template.settings.starsToInvincible)
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

                <!-- 預設範本設定 -->
                <div class="border border-base-200 rounded-lg bg-base-200/40 p-3 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex items-center gap-2 font-semibold">
                            <LucideIcon name="Star" class="w-4 h-4 text-warning" />
                            設為預設範本
                        </div>
                        <input
                            type="checkbox"
                            class="toggle toggle-warning"
                            :checked="assignDefault"
                            @change="handleDefaultToggle"
                        />
                    </div>
                    <p v-if="isCreatingNew" class="text-xs text-warning/90 leading-relaxed">
                        勾選後，儲存時會立即把這個新範本設為預設，日後新增班級會自動套用。
                    </p>
                    <p v-else class="text-xs text-base-content/70 leading-relaxed">
                        儲存後會更新這個範本的設定；若保持勾選，其他班級建立時會預設使用它。
                    </p>
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
import LucideIcon from './LucideIcon.vue'
import {
    buildDefaultMilestoneMessages,
    REWARD_MILESTONE_MESSAGE_MAX_LENGTH,
} from '~/constants/rewards'

interface Props {
    initialTemplate?: RewardTemplate | null
    isCreatingNew?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    initialTemplate: null,
    isCreatingNew: false,
})

const emit = defineEmits<{
    save: [template: RewardTemplate, isNew: boolean]
    cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const isCreatingNew = ref(props.isCreatingNew)

// 初始化範本資料
const template = reactive<RewardTemplate>({
    id: '',
    name: '新的獎勵範本',
    settings: {
        enabled: true,
        pointsPerStar: 10,
        starsToInvincible: 3,
        invincibleDurationSeconds: 600,
        invinciblePointsPerClick: 2,
        milestoneMessages: buildDefaultMilestoneMessages(3),
    },
    isDefault: false,
})

const assignDefault = ref(false)

// 分鐘和秒的計算（僅 UI 用）
const durationMinutes = ref<number>(10)
const durationSeconds = ref<number>(0)

// 監聽 props 變化，更新 template
const ensureMilestones = (settings: RewardSettings): RewardSettings => {
    const threshold = Math.max(1, Math.floor(settings.starsToInvincible || 1))
    const baseMessages = Array.isArray(settings.milestoneMessages)
        ? settings.milestoneMessages
        : buildDefaultMilestoneMessages(threshold)

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
    get: () => ensureMilestones(template.settings).milestoneMessages ?? [],
    set: (messages: RewardMilestoneMessage[]) => {
        template.settings.milestoneMessages = messages
    },
})

const milestoneValidationError = computed(() => {
    const threshold = Math.max(1, template.settings.starsToInvincible || 1)
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
    if (milestoneMessages.value.length <= 1) return
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
            template.isDefault = data.isDefault
            assignDefault.value = !!data.isDefault
        } else {
            template.id = ''
            template.name = '新的獎勵範本'
            template.settings = ensureMilestones({
                enabled: true,
                pointsPerStar: 10,
                starsToInvincible: 3,
                invincibleDurationSeconds: 600,
                invinciblePointsPerClick: 2,
                milestoneMessages: buildDefaultMilestoneMessages(3),
            })
            template.isDefault = false
            assignDefault.value = false
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

/**
 * 打開 Modal
 */
const open = () => {
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
    template.isDefault = assignDefault.value
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

/**
 * 設定為預設範本
 */
const handleDefaultToggle = (event: Event) => {
    const input = event.target as HTMLInputElement
    assignDefault.value = input.checked
}

// 暴露方法給父元件
defineExpose({
    open,
    close,
})
</script>
