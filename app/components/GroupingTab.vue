<template>
    <div class="space-y-6 relative">
        <!-- 各組模式慶祝動畫 -->
        <InvincibleCelebration
            v-if="!isClassTotalMode"
            :visible="invincibleCelebrationState.visible"
            :group-name="invincibleCelebrationState.groupName"
            :duration="invincibleCelebrationState.duration"
            :points-per-click="invincibleCelebrationState.pointsPerClick"
            @close="hideInvincibleCelebration"
        />

        <!-- 全班模式慶祝動畫 -->
        <ClassInvincibleBurstCelebration
            v-if="isClassTotalMode"
            :visible="classTotalCelebrationState.visible"
            :achieved-score="classTotalCelebrationState.achievedScore"
            :duration="classTotalCelebrationState.duration"
            :show-countdown="true"
            :countdown-seconds="classTotalRemainingSeconds"
            @close="hideClassTotalCelebration"
        />

        <GroupingControlPanel
            :grouping-active="classInfo.groupingActive"
            :is-group-edit-mode="isGroupEditMode"
            :group-count-input="groupCountInput"
            :group-count-min="GROUP_CONFIG.minGroups"
            :group-count-max="GROUP_CONFIG.maxGroups"
            :local-groups-length="localGroups.length"
            :activity-name="activityName"
            :has-students-in-groups="hasStudentsInGroups"
            :reward-enabled="rewardInfoSummary.enabled"
            :groups-collapsed="areGroupsCollapsed"
            @update:groupCountInput="(val: string) => (groupCountInput = val)"
            @commitGroupCount="commitGroupCount"
            @buildGroupsForCount="buildGroupsForCount"
            @randomAssignGroups="randomAssignGroups"
            @resetAllGroups="resetAllGroups"
            @openRewardInfoModal="openRewardInfoModal"
            @saveGroupEdits="saveGroupEdits"
            @cancelGroupEdits="cancelGroupEdits"
            @update:activityName="(val: string) => (activityName = val)"
            @expandAllGroups="expandAllGroups"
            @collapseAllGroups="collapseAllGroups"
            @toggleGroupsCollapsed="
                () => uiStore.setGroupingViewCollapsed(!areGroupsCollapsed, props.classInfo.id)
            "
            @startGroupEditing="startGroupEditing"
            @startGrouping="startGrouping"
            @exportActivityReport="(markAsEnded: boolean) => exportActivityReport(markAsEnded)"
            @showGroupScoreboard="showGroupScoreboard"
            @endGrouping="endGrouping"
        />

        <!-- 分組容器 -->
        <div :class="['flex gap-6 h-[calc(100vh-220px)]', isClassTotalMode && 'pb-10']">
            <GroupingSidebar
                :collapsed="isUngroupedCollapsed"
                :grouping-active="classInfo.groupingActive"
                :ungrouped-search="ungroupedSearch"
                :ungrouped-count="ungroupedStudentsCount"
                :filtered-ungrouped-students="filteredUngroupedStudents"
                :selected-student-ids="selectedStudentIds"
                :can-modify-groups="canModifyGroups"
                :leaderboard-groups="leaderboardGroups"
                :group-star-counts="groupStarCounts"
                :show-reward-stars="showGroupStarUI"
                :show-group-total-scores="groupingSettings.showGroupTotalScores"
                @toggle-collapse="(val: boolean) => (isUngroupedCollapsed = val)"
                @update:ungroupedSearch="(val: string) => (ungroupedSearch = val)"
                @clear-selection="clearStudentSelection"
                @toggle-student-selection="toggleStudentSelection"
                @drag-start="
                    (studentId: string, zone: string, event: DragEvent) =>
                        handleDragStart(studentId, zone, event)
                "
                @drag-end="handleDragEnd"
                @unassigned-drop="handleUnassignedDrop"
            />

            <!-- Right Panel: Groups -->
            <main
                ref="groupsContainer"
                class="flex-1 content-start"
                @dragover.prevent="handleContainerDragOver"
            >
                <div
                    :class="[
                        'p-1',
                        classInfo.groupingActive
                            ? groupingSettings.compactMode
                                ? 'grid grid-cols-4 content-start gap-2'
                                : 'grid grid-cols-4 content-start gap-3'
                            : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4',
                    ]"
                >
                    <!-- 各組 -->
                    <GroupCard
                        v-for="group in localGroups"
                        :key="group.id"
                        :compact="classInfo.groupingActive && groupingSettings.compactMode"
                        :is-invincible="group.isInvincible"
                        :invincible-burst="!!invincibleBurstActive[group.id]"
                        :invincible-highlight="!!invincibleHighlight[group.id]"
                        :milestone-message="milestoneBubbles[group.id]?.message ?? null"
                        class="relative"
                    >
                        <template v-if="!classInfo.groupingActive">
                            <div class="flex justify-between items-center gap-3">
                                <div class="flex items-center gap-3 truncate">
                                    <h3
                                        class="flex items-center gap-2 text-base font-semibold truncate"
                                    >
                                        <div
                                            class="w-4 h-4 rounded-full shrink-0"
                                            :style="{ backgroundColor: group.color }"
                                        ></div>
                                        <span class="truncate">{{ group.name }}</span>
                                        <span class="badge badge-ghost badge-sm">{{
                                            getGroupMembers(group).length
                                        }}</span>
                                    </h3>
                                    <div
                                        :class="[
                                            'flex items-center gap-1 text-primary font-semibold whitespace-nowrap',
                                            groupScoreAnimation[group.id],
                                        ]"
                                    >
                                        <span>{{ group.totalScore }}</span>
                                    </div>
                                </div>
                                <div class="dropdown dropdown-end">
                                    <div
                                        tabindex="0"
                                        role="button"
                                        class="btn btn-ghost btn-xs btn-circle"
                                    >
                                        <LucideIcon name="MoreVertical" class="w-4 h-4" />
                                    </div>
                                    <ul
                                        tabindex="0"
                                        class="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 p-2 shadow"
                                    >
                                        <li>
                                            <a @click="editGroupName(group.id)">
                                                <LucideIcon name="Edit" class="w-4 h-4" />
                                                編輯組名
                                            </a>
                                        </li>
                                        <li>
                                            <a @click="deleteGroup(group.id)" class="text-error">
                                                <LucideIcon name="Trash2" class="w-4 h-4" />
                                                刪除組別
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div
                                :class="[
                                    'flex flex-col',
                                    groupingSettings.compactMode ? 'gap-1' : 'gap-1.5',
                                ]"
                            >
                                <div class="flex justify-between items-start">
                                    <h3 class="flex items-center gap-2 text-base font-semibold">
                                        <div
                                            class="w-3 h-3 rounded-full shrink-0 mt-1"
                                            :style="{ backgroundColor: group.color }"
                                        ></div>
                                        <span>{{ group.name }}</span>
                                    </h3>
                                    <div
                                        :class="[
                                            'flex items-center gap-1 text-primary font-semibold text-lg',
                                            groupScoreAnimation[group.id],
                                        ]"
                                    >
                                        <span>{{ group.totalScore }}</span>
                                    </div>
                                </div>

                                <GroupActionButtons
                                    :positive-label="getGroupPositiveLabel(group)"
                                    negative-label="-1"
                                    :disabled="isGroupActionDisabled(group)"
                                    @add-positive="
                                        addGroupScore(group.id, getScoreValue(group.id, 1))
                                    "
                                    @add-negative="addGroupScore(group.id, -1)"
                                />

                                <GroupRewardStatus
                                    v-if="showGroupStarUI"
                                    :group="group"
                                    :formatted-timer="formatCountdownTimer(timers[group.id] || 0)"
                                    :total-stars="getTotalStarsForDisplay(group)"
                                    :star-progress="getStarProgress(group)"
                                    :invincible-progress="getInvincibleProgress(group.id)"
                                    :queue-count="group.invincibleStarQueue || 0"
                                    :star-gain-class="starGainAnimation[group.id] ?? null"
                                    :countdown-critical="isCountdownCritical(group.id)"
                                />
                            </div>
                        </template>

                        <div
                            v-if="!areGroupsCollapsed"
                            :class="[
                                'flex-1 min-h-32 rounded-xl border border-dashed border-base-300 bg-base-100/60 p-2 flex flex-col gap-2 relative mt-2 overflow-visible',
                                dropIndicator.groupId === group.id &&
                                dropIndicator.index === getGroupMembers(group).length
                                    ? 'ring-2 ring-primary/60 ring-offset-2'
                                    : '',
                            ]"
                            @drop="handleGroupDrop(group.id)"
                            @dragover.prevent="handleGroupDragOver(group.id, $event)"
                            @dragenter.prevent="handleGroupDragOver(group.id, $event)"
                        >
                            <div v-if="canModifyGroups" class="flex justify-end">
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs"
                                    :disabled="selectedStudentIds.length === 0"
                                    @click="quickAssignToGroup(group.id)"
                                >
                                    快速指派
                                </button>
                            </div>
                            <GroupMembersList
                                :group-id="group.id"
                                :members="getGroupMembers(group)"
                                :is-edit-mode="isGroupEditMode"
                                :can-modify="canModifyGroups"
                                :grouping-active="classInfo.groupingActive"
                                :show-individual-scores="
                                    groupingSettings.showStudentIndividualScores
                                "
                                :allow-individual-scoring="groupingSettings.allowIndividualScoring"
                                :base-scores="baseScoresForClass"
                                :session-scores="sessionScoresForClass"
                                :student-score-animation="studentScoreAnimation"
                                :drop-indicator="dropIndicator"
                                @drag-start="
                                    (studentId, originGroupId, event) =>
                                        handleDragStart(studentId, originGroupId, event)
                                "
                                @drag-end="handleDragEnd"
                                @member-drag-over="
                                    (gid, index, event) => handleMemberDragOver(gid, index, event)
                                "
                                @member-drop="(gid, index) => handleMemberDrop(gid, index)"
                                @add-individual-score="addIndividualScore"
                            />
                        </div>
                    </GroupCard>
                </div>
            </main>
        </div>

        <!-- 全班模式底部狀態列 -->
        <ClassTotalBottomBar
            v-if="isClassTotalMode && classInfo.groupingActive"
            :current-total="classTotalScore"
            :points-per-invincible="classTotalThreshold"
            :trigger-count="classInfo.classTotalInvincibleCount || 0"
            :is-invincible="classTotalRemainingSeconds > 0"
            :invincible-seconds-remaining="classTotalRemainingSeconds"
            :invincible-points="classTotalInvinciblePoints"
            :invincible-duration-seconds="classTotalInvincibleTotalDuration"
        />

        <!-- 獎勵機制說明 -->
        <dialog ref="rewardInfoModal" class="modal">
            <div class="modal-box max-w-md space-y-4">
                <h3 class="text-lg font-bold flex items-center gap-2">
                    <LucideIcon name="Sparkles" class="w-5 h-5 text-warning" />
                    獎勵機制說明
                </h3>
                <div v-if="rewardInfoSummary.enabled" class="space-y-3 text-sm leading-relaxed">
                    <!-- 全班協作模式 -->
                    <template v-if="rewardInfoSummary.mode === 'class-total'">
                        <p>
                            全班累積達到
                            <span class="font-semibold">{{
                                rewardInfoSummary.classTotalTargetPoints
                            }}</span>
                            分即可啟動無敵星星模式。
                        </p>
                        <ul class="space-y-2">
                            <li class="flex items-start gap-2">
                                <LucideIcon name="Timer" class="w-4 h-4 mt-0.5 text-info" />
                                <span
                                    >無敵狀態將持續
                                    {{
                                        formatDurationDisplay(
                                            rewardInfoSummary.invincibleDurationSeconds,
                                        )
                                    }}。</span
                                >
                            </li>
                            <li class="flex items-start gap-2">
                                <LucideIcon name="Target" class="w-4 h-4 mt-0.5 text-success" />
                                <span
                                    >無敵期間每次加分 = +{{
                                        rewardInfoSummary.invinciblePointsPerClick
                                    }}
                                    分。</span
                                >
                            </li>
                        </ul>
                        <p class="text-xs text-base-content/60">
                            當全班達成目標啟動無敵星星模式，系統會跳出提醒，請把握黃金時段！
                        </p>
                    </template>

                    <!-- 各組獨立模式 -->
                    <template v-else>
                        <p>
                            每累積
                            <span class="font-semibold">{{ rewardInfoSummary.pointsPerStar }}</span>
                            分可獲得 <span class="font-semibold">1 顆星</span>。
                        </p>
                        <ul class="space-y-2">
                            <li class="flex items-start gap-2">
                                <LucideIcon name="Star" class="w-4 h-4 mt-0.5 text-yellow-400" />
                                <span
                                    >集滿
                                    {{ rewardInfoSummary.starsToInvincible }}
                                    顆星即可啟動無敵星星模式。</span
                                >
                            </li>
                            <li class="flex items-start gap-2">
                                <LucideIcon name="Timer" class="w-4 h-4 mt-0.5 text-info" />
                                <span
                                    >無敵狀態將持續
                                    {{
                                        formatDurationDisplay(
                                            rewardInfoSummary.invincibleDurationSeconds,
                                        )
                                    }}。</span
                                >
                            </li>
                            <li class="flex items-start gap-2">
                                <LucideIcon name="Target" class="w-4 h-4 mt-0.5 text-success" />
                                <span
                                    >無敵期間每次加分 = +{{
                                        rewardInfoSummary.invinciblePointsPerClick
                                    }}
                                    分。</span
                                >
                            </li>
                        </ul>
                        <p class="text-xs text-base-content/60">
                            當任何小組啟動無敵星星模式，系統會跳出提醒，請把握黃金時段！
                        </p>
                    </template>
                </div>
                <div v-else class="text-sm text-base-content/70">
                    目前此班級尚未啟用獎勵機制，點擊右上角「獎勵設定」可進行調整。
                </div>
                <div class="modal-action">
                    <form method="dialog">
                        <button type="submit" class="btn btn-ghost">關閉</button>
                    </form>
                </div>
            </div>
        </dialog>

        <!-- 積分儀表板模態 -->
        <dialog ref="scoreboardModal" class="modal">
            <div
                class="modal-box w-11/12 max-w-4xl py-6 sm:py-8 max-h-[90vh] overflow-y-auto my-4 sm:my-6"
            >
                <h3 class="text-lg font-bold mb-4 flex items-center">
                    <LucideIcon name="Trophy" class="w-5 h-5 mr-2" />
                    小組積分儀表板
                </h3>

                <div class="space-y-4">
                    <!-- 排行榜 -->
                    <div
                        v-for="(group, index) in leaderboardGroups"
                        :key="group.id"
                        :class="[
                            'flex items-center justify-between gap-4 p-4 rounded-lg',
                            index === 0
                                ? 'bg-warning/20'
                                : index === 1
                                  ? 'bg-info/20'
                                  : index === 2
                                    ? 'bg-accent/20'
                                    : 'bg-base-200',
                        ]"
                    >
                        <div class="flex items-center gap-4 min-w-0 flex-1">
                            <div class="text-2xl font-bold w-8 shrink-0">
                                {{ index + 1 }}
                            </div>
                            <div
                                class="w-6 h-6 rounded-full shrink-0"
                                :style="{ backgroundColor: group.color }"
                            ></div>
                            <div class="flex-1 min-w-0">
                                <div class="font-semibold truncate">{{ group.name }}</div>
                                <div class="text-sm text-base-content/70">
                                    {{ getGroupMembers(group).length }} 位學生
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="groupingSettings.showGroupTotalScores"
                            class="flex items-center gap-2 shrink-0"
                        >
                            <div
                                v-if="showGroupStarUI"
                                class="badge badge-sm gap-1 bg-amber-100 text-amber-600 border border-amber-200"
                            >
                                <LucideIcon name="Star" class="w-4 h-4" />
                                <span class="text-xs font-semibold">
                                    {{ groupStarCounts[group.id] ?? 0 }}
                                </span>
                            </div>
                            <div class="text-right">
                                <div
                                    :class="[
                                        'text-2xl font-bold text-primary',
                                        groupScoreAnimation[group.id],
                                    ]"
                                >
                                    {{ group.totalScore }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <div v-if="isEndingFlow" class="w-full">
                        <div class="flex justify-between items-center flex-wrap gap-y-2 gap-x-4">
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    @click="() => exportActivityReport(true)"
                                    class="btn btn-info"
                                    :disabled="!activityName.trim()"
                                >
                                    <LucideIcon name="Download" class="w-4 h-4 mr-2" />
                                    匯出活動報表
                                </button>
                                <button @click="resetGroupScores" class="btn btn-warning">
                                    結束並重設分數
                                </button>
                            </div>
                            <button @click="closeScoreboardModal" class="btn btn-ghost">
                                取消
                            </button>
                        </div>
                        <p class="text-xs text-base-content/60 mt-3 w-full">
                            提醒：設置活動名稱方可匯出活動報告，活動結束後就不可再匯出此次分組活動的報告。
                        </p>
                    </div>
                    <div v-else class="w-full flex justify-end">
                        <button @click="closeScoreboardModal" class="btn">關閉</button>
                    </div>
                </div>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeScoreboardModal">close</button>
            </form>
        </dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { ClassInfo, Group, RewardSettings } from '~/types'
import { useExcelExport } from '~/composables/useExcelExport'
import { useClassesStore } from '~/stores/classes'
import { useUIStore } from '~/stores/ui'
import { useRewardsStore } from '~/stores/rewards'
import { GROUP_CONFIG, normalizeGroupCount } from '~/constants/grouping'
import {
    formatCountdownTimer,
    formatDurationDisplay,
    getClassTotalThreshold,
    getClassTotalInvincibleDuration,
    getClassTotalInvinciblePoints,
    REWARD_DEFAULTS,
} from '~/constants/rewards'
import GroupRewardStatus from '~/components/grouping/GroupRewardStatus.vue'
import GroupActionButtons from '~/components/grouping/GroupActionButtons.vue'
import GroupingControlPanel from '~/components/grouping/GroupingControlPanel.vue'
import GroupingSidebar from '~/components/grouping/GroupingSidebar.vue'
import GroupCard from '~/components/grouping/GroupCard.vue'
import GroupMembersList from '~/components/grouping/GroupMembersList.vue'
import InvincibleCelebration from '~/components/grouping/InvincibleCelebration.vue'
import ClassTotalBottomBar from '~/components/grouping/ClassTotalBottomBar.vue'
import ClassInvincibleBurstCelebration from '~/components/grouping/ClassInvincibleBurstCelebration.vue'

interface Props {
    classInfo: ClassInfo
}

const props = defineProps<Props>()
const classesStore = useClassesStore()
const uiStore = useUIStore()
const rewardsStore = useRewardsStore()
const { exportToExcel } = useExcelExport()

// Expose Math to template for use in v-for with Math.min
const Math = globalThis.Math

const formatDateTimeDisplay = (value?: Date | string | number | null) => {
    if (!value) return '—'
    const date =
        value instanceof Date
            ? value
            : typeof value === 'number'
              ? new Date(value)
              : new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('zh-TW')
}

// --- Use Store as the Single Source of Truth ---
const {
    groupingSettings,
    groupingViewCollapsed: areGroupsCollapsed,
    userPreferences,
} = storeToRefs(uiStore)
const {
    groupingBaseScores,
    groupingSessionScores,
    groupingActivityNames,
    groupingSessionGroupScores,
    groupingSessionIndividualScores,
} = storeToRefs(classesStore)

// Modal refs
const scoreboardModal = ref<HTMLDialogElement>()
const rewardInfoModal = ref<HTMLDialogElement>()

// Component-local state
const normalizeGroupCount = (value: number | string | null | undefined): number => {
    const n = Math.floor(Number(value))
    if (!Number.isFinite(n) || n < 2) return 2
    return Math.min(n, 10)
}

const groupCount = ref(normalizeGroupCount(props.classInfo.groupCount))
const groupCountInput = ref(String(groupCount.value))
const isSyncingFromLocal = ref(false)
const localGroups = ref<Group[]>([])
const isUngroupedCollapsed = ref(false)
const isEndingFlow = ref(false)
// const areGroupsCollapsed = ref(false) // Now managed by uiStore
const groupScoreAnimation = ref<Record<string, string | null>>({})
const studentScoreAnimation = ref<Record<string, string | null>>({})
const groupsContainer = ref<HTMLElement | null>(null)
const ungroupedSearch = ref('')
const selectedStudentIds = ref<string[]>([])
const dropIndicator = ref<{ groupId: string | null; index: number | null }>({
    groupId: null,
    index: null,
})
const dragContext = ref<{ studentIds: string[]; sourceGroupId: string | null }>({
    studentIds: [],
    sourceGroupId: null,
})
const isGroupEditMode = ref(false)
const isGroupLocked = ref(true)
const timers = ref<Record<string, number>>({})

// --- Computed Properties for easier template access ---
const activeRewardSettings = computed<RewardSettings | null>(() => {
    if (props.classInfo.rewardSettingsMode === 'disabled') return null
    if (props.classInfo.rewardSettingsMode === 'template') {
        return (
            rewardsStore.getTemplateById(props.classInfo.appliedRewardTemplateId)?.settings || null
        )
    }
    return null
})

const showGroupStarUI = computed(() => {
    return (
        activeRewardSettings.value?.enabled === true &&
        activeRewardSettings.value?.mode === 'group-based'
    )
})

// 判斷是否為全班模式
const isClassTotalMode = computed(() => {
    return activeRewardSettings.value?.mode === 'class-total'
})

const classTotalThreshold = computed(() => {
    if (!activeRewardSettings.value) {
        console.log('🎯 classTotalThreshold: activeRewardSettings 為 null，使用預設值 200')
        return REWARD_DEFAULTS.classTotalMode.pointsPerInvincible
    }
    const result = getClassTotalThreshold(activeRewardSettings.value)
    console.log('🎯 classTotalThreshold computed:', {
        result,
        mode: activeRewardSettings.value?.mode,
        classTotalTargetPoints: activeRewardSettings.value?.classTotalTargetPoints,
        templateId: props.classInfo.appliedRewardTemplateId,
    })
    return result
})

// 調試：監視全班門檻值
watch(classTotalThreshold, (newThreshold) => {
    if (isClassTotalMode.value) {
        console.log('🎯 全班門檻更新:', {
            threshold: newThreshold,
            mode: activeRewardSettings.value?.mode,
            classTotalTargetPoints: activeRewardSettings.value?.classTotalTargetPoints,
            templateId: props.classInfo.appliedRewardTemplateId,
        })
    }
})

const classTotalInvincibleDuration = computed(() => {
    if (!activeRewardSettings.value) {
        return REWARD_DEFAULTS.classTotalMode.invincibleDurationSeconds
    }
    return getClassTotalInvincibleDuration(activeRewardSettings.value)
})

const classTotalInvinciblePoints = computed(() => {
    if (!activeRewardSettings.value) {
        return REWARD_DEFAULTS.classTotalMode.invinciblePointsPerClick
    }
    return getClassTotalInvinciblePoints(activeRewardSettings.value)
})

const classTotalRemainingSeconds = ref(0)
const classTotalInvincibleTotalDuration = ref(0)

const syncClassTotalRemaining = (nowParam?: number) => {
    const now = nowParam ?? Date.now()

    if (!props.classInfo.groupingActive || !isClassTotalMode.value) {
        classTotalRemainingSeconds.value = 0
        return
    }

    const invincibleUntil = props.classInfo.classInvincibleUntil
    if (invincibleUntil && invincibleUntil > now) {
        classTotalRemainingSeconds.value = Math.max(0, Math.ceil((invincibleUntil - now) / 1000))
    } else {
        classTotalRemainingSeconds.value = 0
    }
}

// 全班總分
const classTotalScore = computed(() => {
    if (!isClassTotalMode.value) return 0
    return classesStore.calculateClassTotalScore(props.classInfo.id)
})

// 全班模式的慶祝動畫狀態
const classTotalCelebrationState = ref({
    visible: false,
    achievedScore: 0,
    duration: 0,
})

const rewardInfoSummary = computed(() => {
    const settings = activeRewardSettings.value
    if (!settings) {
        return {
            enabled: false,
        }
    }

    const enabled = !!settings.enabled
    const mode = settings.mode
    const invincibleDurationSeconds = settings.invincibleDurationSeconds
    const invinciblePointsPerClick = settings.invinciblePointsPerClick

    if (mode === 'class-total') {
        const classTotalTargetPoints = getClassTotalThreshold(settings)
        return {
            enabled,
            mode,
            classTotalTargetPoints,
            invincibleDurationSeconds,
            invinciblePointsPerClick,
        }
    }

    // group-based mode
    return {
        enabled,
        mode,
        pointsPerStar: settings.pointsPerStar,
        starsToInvincible: settings.starsToInvincible,
        invincibleDurationSeconds,
        invinciblePointsPerClick,
    }
})

watch(
    () => props.classInfo.id,
    (classId) => {
        if (!classId) return
        uiStore.hydrateGroupingViewCollapsed(classId, props.classInfo.groupingActive ? true : false)
    },
    { immediate: true },
)

watch(
    () => Boolean(activeRewardSettings.value?.enabled),
    (isRewardEnabled) => {
        if (groupingSettings.value.compactMode !== isRewardEnabled) {
            groupingSettings.value.compactMode = isRewardEnabled
            uiStore.persistGroupingSettings()
        }
    },
    { immediate: true },
)

watch(
    isClassTotalMode,
    (isClassMode) => {
        if (!isClassMode) {
            classTotalRemainingSeconds.value = 0
            return
        }
        syncClassTotalRemaining()
    },
    { immediate: true },
)

watch(
    () => props.classInfo.classInvincibleUntil,
    () => {
        syncClassTotalRemaining()
        // 同時更新當前無敵的實際總時長
        const now = Date.now()
        const invincibleUntil = props.classInfo.classInvincibleUntil
        if (invincibleUntil && invincibleUntil > now) {
            classTotalInvincibleTotalDuration.value = Math.max(
                0,
                Math.ceil((invincibleUntil - now) / 1000),
            )
        } else {
            classTotalInvincibleTotalDuration.value = 0
        }
    },
)

const runtimeConfig = useRuntimeConfig()

const invincibleCelebrationState = ref({
    visible: false,
    groupName: '',
    duration: 0,
    pointsPerClick: 0,
})

let invincibleCelebrationTimeout: ReturnType<typeof setTimeout> | null = null
let classCelebrationTimeout: ReturnType<typeof setTimeout> | null = null
let celebrationAudio: HTMLAudioElement | null = null
let statusCheckInterval: ReturnType<typeof setInterval> | null = null

const CELEBRATION_AUTO_CLOSE_MS = 1000

const hideInvincibleCelebration = () => {
    invincibleCelebrationState.value.visible = false
    if (invincibleCelebrationTimeout) {
        clearTimeout(invincibleCelebrationTimeout)
        invincibleCelebrationTimeout = null
    }
}

const hideClassTotalCelebration = () => {
    classTotalCelebrationState.value.visible = false
    if (classCelebrationTimeout) {
        clearTimeout(classCelebrationTimeout)
        classCelebrationTimeout = null
    }
}

const playCelebrationAudio = () => {
    if (!process.client) return
    if (!userPreferences.value.enableSounds) return

    const baseURL = runtimeConfig.app.baseURL || '/'
    if (!celebrationAudio) {
        celebrationAudio = new Audio(`${baseURL}super-star.mp3`)
        celebrationAudio.volume = 0.65
    }

    celebrationAudio.currentTime = 0
    celebrationAudio.play().catch((error) => {
        console.warn('無法播放無敵星星音效：', error)
    })
}

let starAudio: HTMLAudioElement | null = null

const playStarAudio = () => {
    if (!process.client) return
    if (!userPreferences.value.enableSounds) return

    const baseURL = runtimeConfig.app.baseURL || '/'
    if (!starAudio) {
        starAudio = new Audio(`${baseURL}star.mp3`)
        starAudio.volume = 0.5
    }

    starAudio.currentTime = 0
    starAudio.play().catch((error) => {
        console.warn('無法播放星星音效：', error)
    })
}

const updateInvincibleStatus = () => {
    if (!props.classInfo.groupingActive) return

    const now = Date.now()
    syncClassTotalRemaining(now)

    let needsSync = false
    if (props.classInfo.groups) {
        props.classInfo.groups.forEach((group) => {
            if (group.isInvincible && group.invincibleUntil) {
                const remainingMs = group.invincibleUntil - now
                if (remainingMs <= 500) {
                    needsSync = true
                }
            }
        })
    }

    if (needsSync) {
        classesStore.checkInvincibleStatus()
    }

    if (props.classInfo.groups) {
        props.classInfo.groups.forEach((group) => {
            if (group.isInvincible && group.invincibleUntil) {
                const remainingMs = group.invincibleUntil - now

                if (remainingMs <= 0) {
                    delete timers.value[group.id]
                } else if (remainingMs < 1000) {
                    timers.value[group.id] = 1
                } else {
                    timers.value[group.id] = Math.ceil(remainingMs / 1000)
                }
            } else {
                delete timers.value[group.id]
            }
        })
    }
}

const triggerInvincibleCelebrationOverlay = (group: Group, settings: RewardSettings | null) => {
    invincibleCelebrationState.value = {
        visible: true,
        groupName: group.name,
        duration: Math.max(settings?.invincibleDurationSeconds ?? 0, 0),
        pointsPerClick: Math.max(settings?.invinciblePointsPerClick ?? 1, 1),
    }

    if (invincibleCelebrationTimeout) {
        clearTimeout(invincibleCelebrationTimeout)
    }

    playCelebrationAudio()

    invincibleCelebrationTimeout = setTimeout(() => {
        hideInvincibleCelebration()
    }, CELEBRATION_AUTO_CLOSE_MS)
}

// 全班模式慶祝動畫觸發
const triggerClassTotalCelebration = (achievedScore: number) => {
    classTotalCelebrationState.value = {
        visible: true,
        achievedScore,
        duration: Math.max(classTotalInvincibleDuration.value, 0),
    }

    // 立即初始化倒數計時
    classTotalRemainingSeconds.value = Math.max(classTotalInvincibleDuration.value, 0)
    syncClassTotalRemaining()

    if (classCelebrationTimeout) {
        clearTimeout(classCelebrationTimeout)
    }

    playCelebrationAudio()

    // 1 秒後自動關閉慶祝畫面，讓倒數接手
    classCelebrationTimeout = setTimeout(() => {
        hideClassTotalCelebration()
    }, 1000)
}

const {
    starGainAnimation,
    invincibleBurstActive,
    invincibleHighlight,
    milestoneBubbles,
    getTotalStarsForDisplay,
    getStarProgress,
    isCountdownCritical,
    trackGroupUpdate,
    prepareGroupData,
    cleanupForRemovedGroups,
    cleanupRewards,
} = useGroupingRewards({
    activeRewardSettings,
    timers,
    uiNotifier: {
        showToast: uiStore.showToast,
        triggerInvincibleCelebration: ({ group, settings }) =>
            triggerInvincibleCelebrationOverlay(group, settings),
    },
})
const activityName = computed({
    get: () => groupingActivityNames.value[props.classInfo.id] || '',
    set: (newName) => {
        classesStore.setGroupingActivityName(props.classInfo.id, newName)
    },
})
const baseScoresForClass = computed(() => groupingBaseScores.value[props.classInfo.id] || {})
const sessionScoresForClass = computed(() => groupingSessionScores.value[props.classInfo.id] || {})

const groupStarCounts = computed(() => {
    const map: Record<string, number> = {}
    localGroups.value.forEach((group) => {
        map[group.id] = getTotalStarsForDisplay(group)
    })
    return map
})

const baseUngroupedStudents = computed(() => {
    return props.classInfo.students.filter(
        (student) =>
            student.isPresent &&
            !localGroups.value.some((group) =>
                group.members.some((member) => member.id === student.id),
            ),
    )
})

const filteredUngroupedStudents = computed(() => {
    const keyword = ungroupedSearch.value.trim().toLowerCase()
    if (!keyword) {
        return baseUngroupedStudents.value
    }
    return baseUngroupedStudents.value.filter((student) => {
        return (
            student.name.toLowerCase().includes(keyword) ||
            String(student.id).toLowerCase().includes(keyword)
        )
    })
})

const ungroupedStudentsCount = computed(() => baseUngroupedStudents.value.length)

const canModifyGroups = computed(() => isGroupEditMode.value && !props.classInfo.groupingActive)

const sortedGroups = computed(() => {
    return [...localGroups.value].sort((a, b) => b.totalScore - a.totalScore)
})

const leaderboardGroups = computed(() => {
    const sorted = sortedGroups.value
    const count = groupingSettings.value.leaderboardDisplayCount
    if (count === 'all') {
        return sorted
    }
    return sorted.slice(0, count)
})

const hasStudentsInGroups = computed(() => {
    return localGroups.value.some((group) => group.members.length > 0)
})

// --- Methods ---
const openRewardInfoModal = () => {
    rewardInfoModal.value?.showModal()
}

const getInvincibleProgress = (groupId: string) => {
    const duration = activeRewardSettings.value?.invincibleDurationSeconds
    if (!duration || duration <= 0) return 1
    const remainingFromTimer = timers.value[groupId]
    if (typeof remainingFromTimer === 'number') {
        return Math.max(0, Math.min(1, remainingFromTimer / duration))
    }
    const targetGroup = localGroups.value.find((group) => group.id === groupId)
    if (targetGroup?.invincibleUntil) {
        const remainingSeconds = Math.max(0, (targetGroup.invincibleUntil - Date.now()) / 1000)
        return Math.max(0, Math.min(1, remainingSeconds / duration))
    }
    return 1
}

const getScoreValue = (groupId: string, direction: 1 | -1) => {
    const group = localGroups.value.find((g) => g.id === groupId)
    if (!group) return direction
    if (direction < 0) return -1 // 減分總是 -1
    // 加分：檢查無敵狀態和獎勵設定
    if (group.isInvincible && activeRewardSettings.value?.enabled) {
        return activeRewardSettings.value.invinciblePointsPerClick || 1
    }
    return 1
}

const expandAllGroups = () => {
    uiStore.setGroupingViewCollapsed(false, props.classInfo.id)
}

const collapseAllGroups = () => {
    if (localGroups.value.length === 0) return
    uiStore.setGroupingViewCollapsed(true, props.classInfo.id)
}

const getGroupMembers = (group: Group) => {
    // Returns real-time student information from props, not the potentially stale snapshot in group.members
    return group.members.map((member) => {
        const currentStudent = props.classInfo.students.find((s) => s.id === member.id)
        return currentStudent || member
    })
}

const getGroupMembersById = (groupId: string) => {
    const group = localGroups.value.find((g) => g.id === groupId)
    return group ? getGroupMembers(group) : []
}

const isGroupActionDisabled = (group: Group) => {
    return getGroupMembers(group).every((member) => !member.isPresent)
}

const getGroupPositiveLabel = (group: Group) => {
    const settings = activeRewardSettings.value
    let value = 1
    if (group.isInvincible && settings?.enabled) {
        value = settings.invinciblePointsPerClick || 1
    }
    return `+${value}`
}

const persistGroups = () => {
    const clonedGroups: Group[] = localGroups.value.map((group) => ({
        ...group,
        members: group.members.map((member) => ({ ...member })),
    }))
    isSyncingFromLocal.value = true
    classesStore.updateGroups(props.classInfo.id, clonedGroups)
}

const syncGroupsFromProps = (groups: Group[] | null | undefined) => {
    const sourceGroups = Array.isArray(groups) ? groups : []

    const isInitialSync = localGroups.value.length === 0

    sourceGroups.forEach((group) => {
        prepareGroupData(group)
        const previousGroup = localGroups.value.find((g) => g.id === group.id)
        trackGroupUpdate(group, previousGroup, { skipMilestoneAnimation: isInitialSync })
    })

    localGroups.value = sourceGroups.map((group) => ({
        ...prepareGroupData({ ...group }),
        members: group.members?.map((member) => ({ ...member })) || [],
        createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
    }))

    if (localGroups.value.length === 0) {
        uiStore.setGroupingViewCollapsed(false, props.classInfo.id)
    }

    const groupIds = new Set(localGroups.value.map((group) => group.id))
    Object.keys(groupScoreAnimation.value).forEach((id) => {
        if (!groupIds.has(id)) {
            delete groupScoreAnimation.value[id]
        }
    })
    cleanupForRemovedGroups(groupIds)

    if (!isGroupEditMode.value) {
        isGroupLocked.value = true
    }
}

const initializeGroups = () => {
    localGroups.value = []
    const safeCount = getSafeGroupCount()
    for (let i = 1; i <= safeCount; i++) {
        createGroup(`第 ${i} 組`, false)
    }
    if (!isGroupEditMode.value) {
        persistGroups()
    }
}

const createGroup = (name: string, shouldPersist = true, id?: string) => {
    const newGroup: Group = {
        id: id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        members: [],
        totalScore: 0,
        averageScore: 0, // This field is not used
        createdAt: new Date(),
        color: generateGroupColor(),
        stars: 0,
        isInvincible: false,
        invincibleUntil: null,
        invincibleStarQueue: 0,
        totalCollectedStars: 0,
    }
    localGroups.value.push(prepareGroupData(newGroup))
    if (shouldPersist) {
        persistGroups()
    }
    return newGroup
}

const generateGroupColor = (index?: number) => {
    const paletteIndex =
        typeof index === 'number'
            ? index % GROUP_CONFIG.defaultColors.length
            : localGroups.value.length % GROUP_CONFIG.defaultColors.length
    return GROUP_CONFIG.defaultColors[paletteIndex]
}

const getSafeGroupCount = () => normalizeGroupCount(groupCount.value)

const randomAssignGroups = () => {
    const rawCount = Number(groupCountInput.value)
    if (
        !Number.isFinite(rawCount) ||
        rawCount < GROUP_CONFIG.minGroups ||
        rawCount > GROUP_CONFIG.maxGroups
    ) {
        alert(`組數必須介於 ${GROUP_CONFIG.minGroups} 到 ${GROUP_CONFIG.maxGroups} 之間。`)
        return
    }

    if (!props.classInfo?.students?.length) return

    commitGroupCount()

    const confirmation = confirm('這將重新分配所有學生，並將所有組別的總分歸零。確定要繼續嗎？')
    if (!confirmation) return

    const existingGroups = localGroups.value.map((group, index) => ({
        id: group.id || `group_${Date.now()}_${index}`,
        name: group.name?.trim() || `第 ${index + 1} 組`,
        color: group.color || generateGroupColor(index),
        totalScore: 0, // Reset score
        averageScore: 0, // Reset score
        createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
        stars: 0,
        invincibleStarQueue: 0,
        isInvincible: false,
        invincibleUntil: null,
        totalCollectedStars: 0,
    }))

    const baseGroups = existingGroups.length
        ? existingGroups
        : Array.from({ length: getSafeGroupCount() }, (_, index) => ({
              id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: `第 ${index + 1} 組`,
              color: generateGroupColor(index),
              totalScore: 0,
              averageScore: 0,
              createdAt: new Date(),
              stars: 0,
              invincibleStarQueue: 0,
              isInvincible: false,
              invincibleUntil: null,
              totalCollectedStars: 0,
          }))

    const normalizedGroups: Group[] = baseGroups.map((group, index) => ({
        ...group,
        members: [],
        color: group.color || generateGroupColor(index),
    }))

    localGroups.value = normalizedGroups
    groupScoreAnimation.value = {}

    const presentStudents = props.classInfo.students.filter((s) => s.isPresent)
    if (localGroups.value.length === 0) {
        alert('未建立任何組別，請先設定有效的組數')
        return
    }
    if (presentStudents.length === 0) {
        alert('目前沒有出席學生可供分組')
        return
    }
    const shuffledStudents = [...presentStudents].sort(() => Math.random() - 0.5)
    shuffledStudents.forEach((student, index) => {
        const groupIndex = index % localGroups.value.length
        localGroups.value[groupIndex].members.push({ ...student })
    })

    if (!isGroupEditMode.value) {
        persistGroups()
    }
}

const ensureGroupStructure = (targetCount: number, persistAfter = true) => {
    const current = localGroups.value.length
    let changed = false

    if (targetCount > current) {
        for (let i = current; i < targetCount; i++) {
            createGroup(`第 ${i + 1} 組`, false)
            changed = true
        }
    } else if (targetCount < current) {
        const removed = localGroups.value.splice(targetCount)
        changed = removed.length > 0
    }

    if (changed && persistAfter) {
        persistGroups()
    }

    return changed
}

const commitGroupCount = () => {
    if (String(groupCountInput.value).trim() === '') {
        groupCountInput.value = String(groupCount.value)
        return
    }

    const raw = Number(groupCountInput.value)

    if (!Number.isFinite(raw)) {
        groupCountInput.value = String(groupCount.value)
        return
    }

    const normalized = Math.min(
        Math.max(Math.floor(raw), GROUP_CONFIG.minGroups),
        GROUP_CONFIG.maxGroups,
    )

    if (normalized !== groupCount.value) {
        groupCount.value = normalized
        const changed = ensureGroupStructure(normalized, false)
        if (changed && !isGroupEditMode.value) {
            persistGroups()
        }
        classesStore.updateGroupCount(props.classInfo.id, normalized)
    }

    groupCountInput.value = String(groupCount.value)
}

const buildGroupsForCount = () => {
    commitGroupCount()
    const targetCount = getSafeGroupCount()
    ensureGroupStructure(targetCount, !isGroupEditMode.value)
}

const resetAllGroups = () => {
    if (confirm('這會將所有學生移回未分組狀態，但會保留現有組別。確定嗎？')) {
        localGroups.value = localGroups.value.map((group) => ({
            ...group,
            members: [],
        }))
        if (!isGroupEditMode.value) {
            persistGroups()
        }
        clearStudentSelection()
    }
}

const toggleStudentSelection = (studentId: string) => {
    if (!canModifyGroups.value) return
    if (selectedStudentIds.value.includes(studentId)) {
        selectedStudentIds.value = selectedStudentIds.value.filter((id) => id !== studentId)
    } else {
        selectedStudentIds.value = [...selectedStudentIds.value, studentId]
    }
}

const clearStudentSelection = () => {
    selectedStudentIds.value = []
}

const maybeAutoScroll = (event: DragEvent) => {
    const container = groupsContainer.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    const threshold = 80
    const scrollSpeed = 20

    if (event.clientY < rect.top + threshold) {
        container.scrollTop -= scrollSpeed
    } else if (event.clientY > rect.bottom - threshold) {
        container.scrollTop += scrollSpeed
    }
}

const handleDragStart = (studentId: string, sourceGroupId: string | null, event: DragEvent) => {
    if (!canModifyGroups.value) {
        event.preventDefault()
        return
    }

    const selection = new Set(selectedStudentIds.value)
    const studentIds =
        sourceGroupId === 'unassigned' && selection.size > 0 && selection.has(studentId)
            ? Array.from(selection)
            : [studentId]

    dragContext.value = {
        studentIds,
        sourceGroupId,
    }

    dropIndicator.value = { groupId: null, index: null }
    event.dataTransfer?.setData('text/plain', studentIds.join(','))
}

const handleDragEnd = () => {
    dropIndicator.value = { groupId: null, index: null }
}

const handleContainerDragOver = (event: DragEvent) => {
    if (!canModifyGroups.value) return
    maybeAutoScroll(event)
}

const handleGroupDragOver = (groupId: string, event: DragEvent) => {
    if (!canModifyGroups.value) return
    maybeAutoScroll(event)
    dropIndicator.value = { groupId, index: getGroupMembersById(groupId).length }
}

const handleMemberDragOver = (groupId: string, index: number, event: DragEvent) => {
    if (!canModifyGroups.value) return
    maybeAutoScroll(event)
    dropIndicator.value = { groupId, index }
}

const finalizeDrag = (forceClearSelection = false) => {
    if (forceClearSelection || dragContext.value.sourceGroupId === 'unassigned') {
        clearStudentSelection()
    }
    dragContext.value = { studentIds: [], sourceGroupId: null }
    dropIndicator.value = { groupId: null, index: null }
}

const handleGroupDrop = (groupId: string) => {
    if (!canModifyGroups.value) return
    if (!dragContext.value.studentIds.length) return

    const targetIndex =
        dropIndicator.value.groupId === groupId && dropIndicator.value.index !== null
            ? dropIndicator.value.index!
            : getGroupMembersById(groupId).length

    moveStudentsToGroup(dragContext.value.studentIds, groupId, targetIndex)
    finalizeDrag()
}

const handleMemberDrop = (groupId: string, index: number) => {
    if (!canModifyGroups.value) return
    if (!dragContext.value.studentIds.length) return

    const groupMembers = getGroupMembersById(groupId)
    const draggedIds = new Set(dragContext.value.studentIds)
    const precedingDragged = groupMembers
        .slice(0, index)
        .filter((member) => draggedIds.has(member.id)).length

    const adjustedIndex = Math.max(index - precedingDragged, 0)

    moveStudentsToGroup(dragContext.value.studentIds, groupId, adjustedIndex)
    finalizeDrag()
}

const handleUnassignedDrop = () => {
    if (!canModifyGroups.value) return
    if (!dragContext.value.studentIds.length) return

    removeStudentsFromGroups(dragContext.value.studentIds)
    finalizeDrag(true)
}

const moveStudentsToGroup = (studentIds: string[], targetGroupId: string, insertIndex?: number) => {
    if (!studentIds.length) return

    const studentsToInsert = studentIds
        .map((id) => props.classInfo.students.find((s) => s.id === id))
        .filter((student): student is NonNullable<typeof student> => Boolean(student))
        .map((student) => ({ ...student }))

    if (!studentsToInsert.length) return

    const updatedGroups = localGroups.value.map((group) => {
        const remainingMembers = group.members.filter((member) => !studentIds.includes(member.id))

        if (group.id !== targetGroupId) {
            return {
                ...group,
                members: remainingMembers,
            }
        }

        const members = [...remainingMembers]
        const targetIndex =
            typeof insertIndex === 'number'
                ? Math.min(Math.max(insertIndex, 0), members.length)
                : members.length

        members.splice(targetIndex, 0, ...studentsToInsert)

        return {
            ...group,
            members,
        }
    })

    localGroups.value = updatedGroups

    if (!isGroupEditMode.value) {
        if (!isGroupEditMode.value) {
            persistGroups()
        }
    }
}

const removeStudentsFromGroups = (studentIds: string[], shouldPersist = true) => {
    if (!studentIds.length) return

    localGroups.value = localGroups.value.map((group) => ({
        ...group,
        members: group.members.filter((member) => !studentIds.includes(member.id)),
    }))

    if (shouldPersist && !isGroupEditMode.value) {
        persistGroups()
    }
}

const quickAssignToGroup = (groupId: string) => {
    if (!canModifyGroups.value) {
        alert('請先進入編輯模式後再使用快速指派')
        return
    }

    if (selectedStudentIds.value.length === 0) {
        alert('請先在未分組學生列表中選取學生')
        return
    }

    moveStudentsToGroup([...selectedStudentIds.value], groupId)
    clearStudentSelection()
}

const startGroupEditing = () => {
    if (props.classInfo.groupingActive) {
        alert('分組活動進行中，請先結束後再編輯組別。')
        return
    }

    isGroupEditMode.value = true
    isGroupLocked.value = false
    uiStore.setGroupingViewCollapsed(false)
    clearStudentSelection()
}

const saveGroupEdits = () => {
    persistGroups()
    isGroupEditMode.value = false
    isGroupLocked.value = true
    finalizeDrag(true)
}

const cancelGroupEdits = () => {
    syncGroupsFromProps(props.classInfo.groups)
    isGroupEditMode.value = false
    isGroupLocked.value = true
    finalizeDrag(true)
}

const addGroupScore = (groupId: string, score: number) => {
    if (!props.classInfo.groupingActive) return
    const animationClass = score > 0 ? 'animate-score-bounce-green' : 'animate-score-bounce-red'
    groupScoreAnimation.value[groupId] = animationClass
    setTimeout(() => {
        if (groupScoreAnimation.value[groupId] === animationClass) {
            groupScoreAnimation.value[groupId] = null
        }
    }, 500)

    // 如果是全班模式，記錄加分前的總分
    let previousTriggerCount = 0
    if (isClassTotalMode.value && score > 0) {
        previousTriggerCount = props.classInfo.classTotalInvincibleCount || 0
    }

    // The store action now handles all the logic
    classesStore.addScoreToGroup(props.classInfo.id, groupId, score)

    // 在全班模式無敵狀態下，播放星星音效
    if (isClassTotalMode.value && score > 0 && classTotalRemainingSeconds.value > 0) {
        playStarAudio()
    }

    // 如果是全班模式且加分，檢查是否觸發了新的無敵
    if (isClassTotalMode.value && score > 0) {
        const newTriggerCount = props.classInfo.classTotalInvincibleCount || 0

        // 如果觸發計數增加，表示觸發了新的無敵
        if (newTriggerCount > previousTriggerCount) {
            const threshold = classTotalThreshold.value
            const achievedScore = newTriggerCount * threshold
            triggerClassTotalCelebration(achievedScore)
        }
    }
}

const editGroupName = (groupId: string) => {
    const group = localGroups.value.find((g) => g.id === groupId)
    if (!group) return

    const newName = prompt('請輸入新的組名：', group.name)
    if (newName && newName.trim()) {
        group.name = newName.trim()
        persistGroups()
    }
}

const deleteGroup = (groupId: string) => {
    if (confirm('確定要刪除此組別嗎？組內學生將移至未分組。')) {
        const groupIndex = localGroups.value.findIndex((g) => g.id === groupId)
        if (groupIndex > -1) {
            localGroups.value.splice(groupIndex, 1)
            persistGroups()
        }
    }
}

const addIndividualScore = (studentId: string, score: number) => {
    if (!props.classInfo.groupingActive) return

    const animationClass = score > 0 ? 'animate-score-bounce-green' : 'animate-score-bounce-red'
    studentScoreAnimation.value[studentId] = animationClass
    setTimeout(() => {
        if (studentScoreAnimation.value[studentId] === animationClass) {
            studentScoreAnimation.value[studentId] = null
        }
    }, 500)

    classesStore.addIndividualScoreInGroup(props.classInfo.id, studentId, score)
}

const startGrouping = () => {
    if (!hasStudentsInGroups.value) {
        alert('請先將學生分組，才能開始分組活動！')
        return
    }

    const emptyGroups = localGroups.value.filter((group) => getGroupMembers(group).length === 0)
    if (emptyGroups.length > 0) {
        const groupNames = emptyGroups.map((group) => group.name || '未命名組').join('、 ')
        const proceed = confirm(`以下組別目前沒有成員：${groupNames}。\n仍要開始分組活動嗎？`)
        if (!proceed) return
    }

    classesStore.startClassGrouping(props.classInfo.id)
    uiStore.setGroupingViewCollapsed(true, props.classInfo.id) // Set to collapsed when starting
}

const endGrouping = () => {
    isEndingFlow.value = true
    scoreboardModal.value?.showModal()
}

const resetGroupScores = () => {
    if (confirm('確認要重設各組分數嗎？這將清除所有組別的總分。')) {
        localGroups.value.forEach((group) => {
            group.totalScore = 0
        })
        persistGroups() // Persist the reset group scores
        classesStore.endClassGrouping(props.classInfo.id) // End the grouping session
        closeScoreboardModal() // Close the modal
        uiStore.setGroupingViewCollapsed(false, props.classInfo.id) // Set to expanded when ending
    }
}

const showGroupScoreboard = () => {
    isEndingFlow.value = false
    scoreboardModal.value?.showModal()
}

const closeScoreboardModal = () => {
    scoreboardModal.value?.close()
    isEndingFlow.value = false // Reset state
}

const exportActivityReport = (markAsEnded = false) => {
    const exportTimestamp = new Date()
    const dateString = exportTimestamp.toISOString().split('T')[0]
    const isClassTotalModeExport = isClassTotalMode
    const invinciblePointsPerClickExport = activeRewardSettings.value?.invinciblePointsPerClick ?? 0

    if (markAsEnded) {
        classesStore.updateClass(props.classInfo.id, {
            groupingEndedAt: exportTimestamp,
        })
    }

    // --- Sheet 1: Group Summary ---
    let groupSummaryData
    let columnWidths

    if (isClassTotalModeExport && activeRewardSettings.value?.enabled) {
        // 全班模式：顯示全班累積分數、無敵觸發次數
        groupSummaryData = sortedGroups.value.map((group, index) => ({
            排行: index + 1,
            組別: group.name,
            人數: getGroupMembers(group).length,
            總分: group.totalScore,
        }))

        columnWidths = [
            { wch: 8 }, // 排行
            { wch: 25 }, // 組別
            { wch: 8 }, // 人數
            { wch: 10 }, // 總分
        ]
    } else {
        // 各組模式：顯示星星數
        groupSummaryData = sortedGroups.value.map((group, index) => ({
            排行: index + 1,
            組別: group.name,
            人數: getGroupMembers(group).length,
            總分: group.totalScore,
            ...(activeRewardSettings.value?.enabled && {
                星星數: getTotalStarsForDisplay(group),
            }),
        }))

        columnWidths = [
            { wch: 8 }, // 排行
            { wch: 25 }, // 組別
            { wch: 8 }, // 人數
            { wch: 10 }, // 總分
        ]

        if (activeRewardSettings.value?.enabled) {
            columnWidths.push({ wch: 10 }) // 星星數
        }
    }

    const latestClassData =
        classesStore.classes.find((cls) => cls.id === props.classInfo.id) || props.classInfo

    const groupSheetHeader: any[] = [
        [`活動名稱:`, activityName.value || '未命名'],
        [`班級:`, latestClassData.name],
        [`匯出日期:`, exportTimestamp.toLocaleString('zh-TW')],
        [`活動開始時間:`, formatDateTimeDisplay(latestClassData.groupingStartedAt ?? null)],
        [`活動結束時間:`, formatDateTimeDisplay(latestClassData.groupingEndedAt ?? null)],
    ]

    // 全班模式時加上統計資訊
    if (isClassTotalModeExport && activeRewardSettings.value?.enabled) {
        groupSheetHeader.push([`全班累積分數:`, classTotalScore.value])
        groupSheetHeader.push([`無敵模式每次加分:`, invinciblePointsPerClickExport])
        groupSheetHeader.push([
            `無敵模式觸發次數:`,
            latestClassData.classTotalInvincibleCount ?? 0,
        ])
        groupSheetHeader.push([])
    } else {
        groupSheetHeader.push([])
    }

    const groupSheet = {
        sheetName: '分組摘要',
        header: groupSheetHeader,
        data: groupSummaryData,
        columnWidths,
    }

    // --- Sheet 2: Student Details ---
    const studentDetailsData = localGroups.value.flatMap((group) =>
        getGroupMembers(group).map((member) => {
            const baseScore = baseScoresForClass.value[member.id] ?? 0
            const totalSessionScore = sessionScoresForClass.value[member.id] ?? 0
            const groupWideScore =
                groupingSessionGroupScores.value[props.classInfo.id]?.[member.id] ?? 0
            const individualGroupScore =
                groupingSessionIndividualScores.value[props.classInfo.id]?.[member.id] ?? 0

            return {
                組別: group.name,
                座號: member.id,
                姓名: member.name,
                出席情況: member.isPresent ? '出席' : '缺席',
                小組團體加分: groupWideScore,
                小組個人加分: individualGroupScore,
                本次活動總得分: totalSessionScore,
                活動後總分: baseScore + totalSessionScore,
            }
        }),
    )

    const studentColumnWidths = [
        { wch: 25 }, // 組別
        { wch: 10 }, // 座號
        { wch: 15 }, // 姓名
        { wch: 12 }, // 出席情況
        { wch: 15 }, // 小組團體加分
        { wch: 15 }, // 小組個人加分
        { wch: 15 }, // 本次活動總得分
        { wch: 15 }, // 活動後總分
    ]

    const studentSheet = {
        sheetName: '學生得分明細',
        data: studentDetailsData,
        columnWidths: studentColumnWidths,
    }

    const invincibleEvents = Array.isArray(latestClassData.invincibleEvents)
        ? latestClassData.invincibleEvents
        : []
    const sortedInvincibleEvents = [...invincibleEvents]
        .map((event) => ({
            ...event,
            timestamp:
                event.timestamp instanceof Date
                    ? event.timestamp
                    : new Date(event.timestamp as any),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const invincibleEventsData =
        sortedInvincibleEvents.length > 0
            ? sortedInvincibleEvents.map((event, index) => ({
                  序號: index + 1,
                  組別: event.groupName,
                  觸發時間: formatDateTimeDisplay(event.timestamp),
                  無敵加分: event.points,
              }))
            : [
                  {
                      序號: '—',
                      組別: '—',
                      觸發時間: '目前尚無無敵模式加分紀錄',
                      無敵加分: '—',
                  },
              ]

    const invincibleSheet = {
        sheetName: '無敵模式紀錄',
        data: invincibleEventsData,
        columnWidths: [
            { wch: 8 },
            { wch: 20 },
            { wch: 26 },
            { wch: 12 },
        ],
    }

    const fileName = `${dateString}-${activityName.value || '分組活動報告'}-${props.classInfo.name}`
    exportToExcel([groupSheet, studentSheet, invincibleSheet], fileName)
}

    watch(
    () => props.classInfo.groups,
    (groups) => {
        syncGroupsFromProps(groups as Group[])

        if (isSyncingFromLocal.value) {
            isSyncingFromLocal.value = false
        }
    },
    { deep: true, immediate: true },
)

watch(
    () => props.classInfo.groupCount,
    (value) => {
        const normalized = normalizeGroupCount(value)
        if (groupCount.value !== normalized) {
            groupCount.value = normalized
        }
        groupCountInput.value = String(normalized)
    },
    { immediate: true },
)

watch(
    () => groupCount.value,
    (value, oldValue) => {
        if (value === oldValue) return
        groupCountInput.value = String(value)
    },
)

watch(
    () => baseUngroupedStudents.value.map((student) => student.id),
    (ids) => {
        const validIds = new Set(ids)
        selectedStudentIds.value = selectedStudentIds.value.filter((id) => validIds.has(id))
    },
)

watch(
    () => props.classInfo.groupingActive,
    (isActive) => {
        if (isActive) {
            isGroupEditMode.value = false
            isGroupLocked.value = true
            clearStudentSelection()
            syncClassTotalRemaining()
            updateInvincibleStatus()
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval)
            }
            statusCheckInterval = setInterval(updateInvincibleStatus, 250)
        } else {
            classTotalRemainingSeconds.value = 0
            if (statusCheckInterval) {
                clearInterval(statusCheckInterval)
                statusCheckInterval = null
            }
            timers.value = {}
        }
    },
    { immediate: true },
)

onUnmounted(() => {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
        statusCheckInterval = null
    }
    if (invincibleCelebrationTimeout) {
        clearTimeout(invincibleCelebrationTimeout)
        invincibleCelebrationTimeout = null
    }
    if (classCelebrationTimeout) {
        clearTimeout(classCelebrationTimeout)
        classCelebrationTimeout = null
    }
    if (celebrationAudio) {
        celebrationAudio.pause()
        celebrationAudio = null
    }
    hideInvincibleCelebration()
    classTotalRemainingSeconds.value = 0
    cleanupRewards()
})
</script>

<style scoped>
@import '@/assets/score-animate.css';

.leaderboard-move,
.leaderboard-enter-active,
.leaderboard-leave-active {
    transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.leaderboard-enter-from,
.leaderboard-leave-to {
    opacity: 0;
    transform: scaleY(0.01) translate(30px, 0);
}
.leaderboard-leave-active {
    position: absolute;
}

.star-counter {
    display: inline-flex;
    min-width: 1.5rem;
    align-items: center;
}
</style>
