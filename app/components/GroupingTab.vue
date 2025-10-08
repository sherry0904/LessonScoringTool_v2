<template>
    <div class="space-y-6">
        <!-- 分組控制面板 -->
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body p-4">
                <!-- INACTIVE STATE: Setup Panel -->
                <template v-if="!classInfo.groupingActive">
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
                                    v-model="groupCountInput"
                                    type="number"
                                    min="2"
                                    max="10"
                                    class="input input-bordered w-20"
                                    @blur="commitGroupCount"
                                    @keyup.enter="commitGroupCount"
                                />
                            </div>
                            <button @click="buildGroupsForCount" class="btn btn-outline">
                                <LucideIcon name="PlusCircle" class="w-4 h-4 mr-2" />建立組別
                            </button>
                            <button @click="randomAssignGroups" class="btn btn-primary">
                                <LucideIcon name="Shuffle" class="w-4 h-4 mr-2" />一鍵隨機分組
                            </button>
                            <button @click="resetAllGroups" class="btn btn-ghost">
                                <LucideIcon name="Undo2" class="w-4 h-4 mr-2" />一鍵還原
                            </button>
                            <div class="ml-auto flex gap-2">
                                <button
                                    @click="saveGroupEdits"
                                    class="btn btn-success"
                                    :disabled="localGroups.length === 0"
                                >
                                    <LucideIcon name="Save" class="w-4 h-4 mr-2" />儲存組別編輯
                                </button>
                                <button @click="cancelGroupEdits" class="btn btn-ghost">
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
                                    v-model="activityName"
                                    type="text"
                                    placeholder="例如：第二次分組討論"
                                    class="input input-bordered w-60"
                                />
                            </div>

                            <div class="ml-auto flex items-center gap-2">
                                <button
                                    @click="expandAllGroups"
                                    class="btn btn-sm btn-outline gap-1"
                                    :disabled="localGroups.length === 0"
                                    title="展開所有組員"
                                >
                                    <LucideIcon name="ChevronDown" class="w-4 h-4" />展開
                                </button>
                                <button
                                    @click="collapseAllGroups"
                                    class="btn btn-sm btn-outline gap-1"
                                    :disabled="localGroups.length === 0"
                                    title="收合所有組員"
                                >
                                    <LucideIcon name="ChevronUp" class="w-4 h-4" />收合
                                </button>
                                <button @click="startGroupEditing" class="btn btn-outline">
                                    <LucideIcon name="SquarePen" class="w-4 h-4 mr-2" />編輯組別
                                </button>
                                <button
                                    v-if="classInfo.groupingActive"
                                    @click="showGroupScoreboard"
                                    class="btn btn-warning"
                                >
                                    <LucideIcon name="Trophy" class="w-4 h-4 mr-2" />積分儀表板
                                </button>
                                <button
                                    @click="startGrouping"
                                    class="btn btn-success gap-2"
                                    :disabled="localGroups.length === 0 || !hasStudentsInGroups"
                                >
                                    <LucideIcon name="Play" class="w-4 h-4" />開始分組活動
                                </button>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- ACTIVE STATE: Compact Control Bar -->
                <template v-else>
                    <div class="flex flex-wrap gap-x-4 gap-y-2 items-center justify-between">
                        <div class="flex items-center gap-3 flex-wrap">
                            <span class="flex items-center gap-2 text-info font-semibold">
                                <LucideIcon name="CircleDot" class="w-5 h-5 animate-pulse" />
                                <span>分組進行中</span>
                            </span>
                            <input
                                v-model="activityName"
                                type="text"
                                placeholder="請輸入活動名稱..."
                                class="input input-sm input-bordered w-52"
                            />
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                @click="expandAllGroups"
                                class="btn btn-sm btn-outline gap-1"
                                :disabled="localGroups.length === 0"
                                title="展開所有組員"
                            >
                                <LucideIcon name="ChevronDown" class="w-4 h-4" />
                                展開組員
                            </button>
                            <button
                                @click="collapseAllGroups"
                                class="btn btn-sm btn-outline gap-1"
                                :disabled="localGroups.length === 0"
                                title="收合所有組員"
                            >
                                <LucideIcon name="ChevronUp" class="w-4 h-4" />
                                收合組員
                            </button>
                            <button
                                @click="exportActivityReport"
                                class="btn btn-sm btn-info gap-1"
                                :disabled="!activityName.trim()"
                                title="匯出活動報告"
                            >
                                <LucideIcon name="Download" class="w-4 h-4" />
                                匯出
                            </button>
                            <button
                                @click="showGroupScoreboard"
                                class="btn btn-sm btn-warning gap-1"
                                title="顯示積分儀表板"
                            >
                                <LucideIcon name="Trophy" class="w-4 h-4" />
                                儀表板
                            </button>
                            <button @click="endGrouping" class="btn btn-sm btn-error gap-1">
                                <LucideIcon name="Square" class="w-4 h-4" />
                                結束分組
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 分組容器 -->
        <div class="flex gap-6 h-[calc(100vh-220px)]">
            <!-- Left Panel: Ungrouped Students -->
            <aside
                :class="[
                    'transition-all duration-300 flex-shrink-0',
                    isUngroupedCollapsed ? 'w-20' : 'w-80',
                ]"
            >
                <div class="card bg-base-100 shadow-sm h-full flex flex-col">
                    <div class="card-body flex flex-col h-full">
                        <div class="flex items-center justify-between mb-4">
                            <h3
                                v-if="!isUngroupedCollapsed"
                                class="card-title text-base flex items-center whitespace-nowrap"
                            >
                                <LucideIcon name="Users" class="w-5 h-5 mr-2" />
                                未分組學生
                                <span class="badge badge-neutral ml-2"
                                    >{{ ungroupedStudentsCount }} 人</span
                                >
                            </h3>
                            <button
                                @click="isUngroupedCollapsed = !isUngroupedCollapsed"
                                class="btn btn-ghost btn-sm btn-circle"
                                :title="isUngroupedCollapsed ? '展開' : '收合'"
                            >
                                <LucideIcon
                                    :name="isUngroupedCollapsed ? 'ChevronsRight' : 'ChevronsLeft'"
                                    class="w-4 h-4"
                                />
                            </button>
                        </div>

                        <div
                            v-if="!isUngroupedCollapsed"
                            class="flex-1 overflow-y-auto space-y-3 p-1"
                            @drop="handleUnassignedDrop"
                            @dragover.prevent
                            @dragenter.prevent
                        >
                            <div class="sticky top-0 bg-base-100 pb-2 z-10">
                                <label
                                    class="input input-bordered input-sm flex items-center gap-2"
                                >
                                    <LucideIcon
                                        name="Search"
                                        class="w-4 h-4 text-base-content/60"
                                    />
                                    <input
                                        v-model="ungroupedSearch"
                                        type="text"
                                        class="grow"
                                        placeholder="搜尋姓名或座號"
                                    />
                                    <button
                                        v-if="ungroupedSearch"
                                        type="button"
                                        class="btn btn-xs btn-ghost"
                                        @click="ungroupedSearch = ''"
                                    >
                                        清除
                                    </button>
                                </label>
                                <div
                                    class="mt-3 flex items-center justify-between text-xs text-base-content/70"
                                >
                                    <span>已選 {{ selectedStudentIds.length }} 人</span>
                                    <button
                                        type="button"
                                        class="btn btn-ghost btn-xs"
                                        :disabled="selectedStudentIds.length === 0"
                                        @click="clearStudentSelection"
                                    >
                                        清除選取
                                    </button>
                                </div>
                            </div>

                            <div
                                v-for="student in filteredUngroupedStudents"
                                :key="student.id"
                                :class="[
                                    'p-3 bg-base-200 rounded-lg cursor-move hover:bg-base-300 transition-colors',
                                    'flex justify-between items-center gap-3',
                                    selectedStudentIds.includes(student.id) && canModifyGroups
                                        ? 'ring-2 ring-primary ring-offset-2'
                                        : '',
                                    'mt-2',
                                ]"
                                :draggable="canModifyGroups"
                                @dragstart="handleDragStart(student.id, 'unassigned', $event)"
                                @dragend="handleDragEnd"
                            >
                                <div class="flex items-start gap-3 flex-1">
                                    <input
                                        v-if="canModifyGroups"
                                        type="checkbox"
                                        class="checkbox checkbox-sm mt-1"
                                        :checked="selectedStudentIds.includes(student.id)"
                                        @click.stop="toggleStudentSelection(student.id)"
                                    />
                                    <div class="font-medium">{{ student.name }}</div>
                                    <div class="text-sm text-base-content/70">
                                        座號 {{ student.id }}
                                    </div>
                                </div>
                                <div class="text-sm font-semibold text-primary">
                                    {{ student.totalScore }}分
                                </div>
                            </div>

                            <div
                                v-if="filteredUngroupedStudents.length === 0"
                                class="text-center text-base-content/50 py-8"
                            >
                                所有學生都已分組
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <!-- Right Panel: Groups -->
            <main
                ref="groupsContainer"
                class="flex-1 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 content-start overflow-y-auto"
                @dragover.prevent="handleContainerDragOver"
            >
                <!-- 各組 -->
                <div
                    v-for="group in localGroups"
                    :key="group.id"
                    class="card bg-base-100 shadow-sm h-full"
                >
                    <div class="card-body h-full">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="flex items-center gap-2 text-lg md:text-xl font-semibold">
                                <div
                                    class="w-4 h-4 rounded-full mr-2"
                                    :style="{ backgroundColor: group.color }"
                                ></div>
                                {{ group.name }}
                                <span class="ml-1 text-xs text-base-content/60">
                                    {{ getGroupMembers(group).length }} 人
                                </span>
                            </h3>

                            <div class="dropdown dropdown-end">
                                <div
                                    tabindex="0"
                                    role="button"
                                    class="btn btn-ghost btn-sm btn-circle"
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
                                        <a @click="addGroupScore(group.id, 1)" class="text-success">
                                            <LucideIcon name="Plus" class="w-4 h-4" />
                                            加 1 分
                                        </a>
                                    </li>
                                    <li>
                                        <a @click="addGroupScore(group.id, -1)" class="text-error">
                                            <LucideIcon name="Minus" class="w-4 h-4" />
                                            扣 1 分
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

                        <!-- 組別總分 -->
                        <div
                            v-if="!isGroupEditMode"
                            class="flex flex-col items-center justify-center bg-gradient-to-br from-base-200 via-base-100 to-base-300 rounded-xl p-4 mb-4 gap-3"
                        >
                            <span class="text-xs text-base-content/60">總分</span>
                            <span
                                :class="[
                                    'font-extrabold text-xl md:text-2xl lg:text-3xl text-primary px-2 py-1',
                                    groupScoreAnimation[group.id],
                                ]"
                            >
                                {{ group.totalScore }}
                            </span>
                            <div
                                v-if="classInfo.groupingActive"
                                class="flex items-center justify-center gap-3 w-full"
                            >
                                <button
                                    @click="addGroupScore(group.id, 1)"
                                    :disabled="
                                        !classInfo.groupingActive ||
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                    "
                                    :title="
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                            ? '本組全員缺席，無法加分'
                                            : ''
                                    "
                                    :class="[
                                        'btn btn-md font-bold text-base px-6 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white border-none shadow transition-transform hover:scale-105 hover:from-green-500 hover:to-emerald-600',
                                        !classInfo.groupingActive ||
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                            ? 'opacity-50 cursor-not-allowed hover:scale-100'
                                            : '',
                                    ]"
                                >
                                    +1
                                </button>
                                <button
                                    @click="addGroupScore(group.id, -1)"
                                    :disabled="
                                        !classInfo.groupingActive ||
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                    "
                                    :title="
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                            ? '本組全員缺席，無法扣分'
                                            : ''
                                    "
                                    :class="[
                                        'btn btn-md font-bold text-base px-6 py-1 rounded-full bg-gradient-to-r from-rose-400 to-red-500 text-white border-none shadow transition-transform hover:scale-105 hover:from-rose-500 hover:to-red-600',
                                        !classInfo.groupingActive ||
                                        getGroupMembers(group).every((m) => !m.isPresent)
                                            ? 'opacity-50 cursor-not-allowed hover:scale-100'
                                            : '',
                                    ]"
                                >
                                    -1
                                </button>
                            </div>
                        </div>

                        <!-- 組員列表 -->
                        <div
                            v-if="!areGroupsCollapsed"
                            :class="[
                                'flex-1 min-h-32 rounded-xl border border-dashed border-base-300 bg-base-100/60 p-2 flex flex-col gap-2 relative',
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
                            <div
                                :class="[
                                    'flex-1',
                                    isGroupEditMode
                                        ? 'grid grid-cols-1 md:grid-cols-2 gap-2'
                                        : 'flex flex-col gap-2',
                                ]"
                            >
                                <div
                                    v-for="(member, index) in getGroupMembers(group)"
                                    :key="member.id"
                                    :class="[
                                        'rounded transition-all',
                                        canModifyGroups
                                            ? 'cursor-move border border-base-200 bg-base-100'
                                            : member.isPresent
                                              ? 'bg-base-200'
                                              : 'bg-gray-200 text-gray-400 opacity-60',
                                        dropIndicator.groupId === group.id &&
                                        dropIndicator.index === index
                                            ? 'ring-2 ring-primary ring-offset-2'
                                            : '',
                                        !canModifyGroups && member.isPresent
                                            ? 'hover:bg-base-300'
                                            : '',
                                    ]"
                                    :draggable="canModifyGroups"
                                    @dragstart="handleDragStart(member.id, group.id, $event)"
                                    @dragend="handleDragEnd"
                                    @dragover.prevent="
                                        handleMemberDragOver(group.id, index, $event)
                                    "
                                    @drop.stop="handleMemberDrop(group.id, index)"
                                >
                                    <template v-if="isGroupEditMode">
                                        <div class="px-3 py-2 flex flex-col gap-1">
                                            <div class="text-xs text-base-content/70">
                                                座號 {{ member.id }}
                                            </div>
                                            <div class="font-medium text-sm">{{ member.name }}</div>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="p-2 flex justify-between items-center">
                                            <div>
                                                <div class="font-medium text-sm flex items-center">
                                                    {{ member.name }}
                                                    <span
                                                        v-if="!member.isPresent"
                                                        class="ml-2 px-2 py-0.5 rounded bg-gray-300 text-xs text-gray-600"
                                                        >今日缺席</span
                                                    >
                                                </div>
                                                <div class="text-xs text-base-content/70">
                                                    {{ member.id }}
                                                </div>
                                            </div>
                                            <div
                                                class="text-xs font-semibold text-primary flex items-center gap-1"
                                            >
                                                <template v-if="props.classInfo.groupingActive">
                                                    <span class="opacity-60">{{
                                                        baseScoresForClass[member.id] ?? ''
                                                    }}</span>
                                                    <span class="opacity-60">分</span>
                                                    <LucideIcon
                                                        name="ArrowRight"
                                                        class="w-3 h-3 text-success"
                                                    />
                                                    <span
                                                        :class="[
                                                            'text-success font-bold',
                                                            studentScoreAnimation[member.id],
                                                        ]"
                                                        >{{
                                                            (baseScoresForClass[member.id] ?? 0) +
                                                            (sessionScoresForClass[member.id] ?? 0)
                                                        }}</span
                                                    >
                                                    <span class="text-success">分</span>

                                                    <div class="ml-2 flex gap-1">
                                                        <button
                                                            @click="
                                                                addIndividualScore(member.id, 1)
                                                            "
                                                            class="btn btn-xs btn-circle btn-outline btn-success"
                                                            title="個人加分"
                                                        >
                                                            +
                                                        </button>
                                                        <button
                                                            @click="
                                                                addIndividualScore(member.id, -1)
                                                            "
                                                            class="btn btn-xs btn-circle btn-outline btn-error"
                                                            title="個人扣分"
                                                        >
                                                            -
                                                        </button>
                                                    </div>
                                                </template>
                                                <template v-else>
                                                    {{ member.totalScore }}分
                                                </template>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <div
                                v-if="getGroupMembers(group).length === 0"
                                class="flex flex-1 items-center justify-center text-center text-base-content/50 text-sm"
                            >
                                {{ canModifyGroups ? '拖曳學生或點快速指派' : '目前沒有組員' }}
                            </div>
                        </div>
                        <p v-else class="text-xs text-base-content/60 italic text-center">
                            組員已收合，點擊「展開組員」查看
                        </p>
                    </div>
                </div>
            </main>
        </div>

        <!-- 積分儀表板模態 -->
        <dialog ref="scoreboardModal" class="modal">
            <div class="modal-box w-11/12 max-w-4xl">
                <h3 class="text-lg font-bold mb-4 flex items-center">
                    <LucideIcon name="Trophy" class="w-5 h-5 mr-2" />
                    小組積分儀表板
                </h3>

                <div class="space-y-4">
                    <!-- 排行榜 -->
                    <div
                        v-for="(group, index) in sortedGroups"
                        :key="group.id"
                        :class="[
                            'flex items-center gap-4 p-4 rounded-lg',
                            index === 0
                                ? 'bg-warning/20'
                                : index === 1
                                  ? 'bg-info/20'
                                  : index === 2
                                    ? 'bg-accent/20'
                                    : 'bg-base-200',
                        ]"
                    >
                        <div class="text-2xl font-bold w-8">
                            {{ index + 1 }}
                        </div>
                        <div
                            class="w-6 h-6 rounded-full"
                            :style="{ backgroundColor: group.color }"
                        ></div>
                        <div class="flex-1">
                            <div class="font-semibold">{{ group.name }}</div>
                            <div class="text-sm text-base-content/70">
                                {{ getGroupMembers(group).length }} 人
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-primary">
                                {{ group.totalScore }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-action">
                    <div v-if="isEndingFlow" class="w-full">
                        <div class="flex justify-between items-center flex-wrap gap-y-2 gap-x-4">
                            <div class="flex gap-2 flex-wrap">
                                <button
                                    @click="exportActivityReport"
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
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { ClassInfo, Group } from '~/types'
import { useExcelExport } from '~/composables/useExcelExport'
import { useClassesStore } from '~/stores/classes'

interface Props {
    classInfo: ClassInfo
}

const props = defineProps<Props>()
const classesStore = useClassesStore()
const { exportToExcel } = useExcelExport()

// --- Use Store as the Single Source of Truth ---
const {
    groupingBaseScores,
    groupingSessionScores,
    groupingActivityNames,
    groupingSessionGroupScores,
    groupingSessionIndividualScores,
} = storeToRefs(classesStore)

// Modal refs
const scoreboardModal = ref<HTMLDialogElement>()

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
// const activityName = ref('') // Replaced by computed property linked to store
const isEndingFlow = ref(false)
const areGroupsCollapsed = ref(false)
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

// --- Computed Properties for easier template access ---
const activityName = computed({
    get: () => groupingActivityNames.value[props.classInfo.id] || '',
    set: (newName) => {
        classesStore.setGroupingActivityName(props.classInfo.id, newName)
    },
})
const baseScoresForClass = computed(() => groupingBaseScores.value[props.classInfo.id] || {})
const sessionScoresForClass = computed(() => groupingSessionScores.value[props.classInfo.id] || {})

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

const hasStudentsInGroups = computed(() => {
    return localGroups.value.some((group) => group.members.length > 0)
})

// --- Methods ---

const expandAllGroups = () => {
    areGroupsCollapsed.value = false
}

const collapseAllGroups = () => {
    if (localGroups.value.length === 0) return
    areGroupsCollapsed.value = true
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
    localGroups.value = sourceGroups.map((group) => ({
        ...group,
        members: group.members?.map((member) => ({ ...member })) || [],
        createdAt: group.createdAt ? new Date(group.createdAt) : new Date(),
    }))

    if (localGroups.value.length === 0) {
        areGroupsCollapsed.value = false
    }

    const groupIds = new Set(localGroups.value.map((group) => group.id))
    Object.keys(groupScoreAnimation.value).forEach((id) => {
        if (!groupIds.has(id)) {
            delete groupScoreAnimation.value[id]
        }
    })

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
    }
    localGroups.value.push(newGroup)
    if (shouldPersist) {
        persistGroups()
    }
    return newGroup
}

const GROUP_COLORS = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
]

const generateGroupColor = (index?: number) => {
    const paletteIndex =
        typeof index === 'number'
            ? index % GROUP_COLORS.length
            : localGroups.value.length % GROUP_COLORS.length
    return GROUP_COLORS[paletteIndex]
}

const getSafeGroupCount = () => normalizeGroupCount(groupCount.value)

const randomAssignGroups = () => {
    const rawCount = Number(groupCountInput.value)
    if (!Number.isFinite(rawCount) || rawCount < 2 || rawCount > 10) {
        alert('組數必須介於 2 到 10 之間。')
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

    const normalized = Math.min(Math.max(Math.floor(raw), 2), 10)

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
    areGroupsCollapsed.value = false
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
    // The store action now handles all the logic
    classesStore.addScoreToGroup(props.classInfo.id, groupId, score)
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
    classesStore.startClassGrouping(props.classInfo.id)
    areGroupsCollapsed.value = true // Set to collapsed when starting
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
        areGroupsCollapsed.value = false // Set to expanded when ending
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

const exportActivityReport = () => {
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]

    // --- Sheet 1: Group Summary ---
    const groupSummaryData = sortedGroups.value.map((group, index) => ({
        排行: index + 1,
        組別: group.name,
        總分: group.totalScore,
        人數: getGroupMembers(group).length,
    }))

    const groupSheet = {
        sheetName: '分組摘要',
        header: [
            [`活動名稱:`, activityName.value || '未命名'],
            [`班級:`, props.classInfo.name],
            [`匯出日期:`, today.toLocaleString('zh-TW')],
            [],
        ],
        data: groupSummaryData,
        columnWidths: [{ wch: 8 }, { wch: 25 }, { wch: 10 }, { wch: 10 }],
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

    const studentSheet = {
        sheetName: '學生得分明細',
        data: studentDetailsData,
        columnWidths: [
            { wch: 25 },
            { wch: 10 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 }, // 小組團體加分
            { wch: 15 }, // 小組個人加分
            { wch: 15 }, // 本次活動總得分
            { wch: 15 }, // 活動後總分
        ],
    }

    const fileName = `${dateString}-${activityName.value || '分組活動報告'}-${props.classInfo.name}`
    exportToExcel([groupSheet, studentSheet], fileName)
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
        }
    },
    { immediate: true },
)
</script>

<style scoped>
@import '@/assets/score-animate.css';
</style>
