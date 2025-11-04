<template>
    <aside
        :class="[
            'transition-all duration-300 flex-shrink-0',
            collapsed ? 'w-20' : 'w-80',
        ]"
    >
        <div class="card bg-base-100 shadow-sm h-full flex flex-col">
            <div class="card-body flex flex-col h-full p-4">
                <template v-if="!groupingActive">
                    <div class="flex items-center justify-between mb-4">
                        <h3
                            v-if="!collapsed"
                            class="card-title text-base flex items-center whitespace-nowrap"
                        >
                            <LucideIcon name="Users" class="w-5 h-5 mr-2" />
                            未分組學生
                            <span class="badge badge-neutral ml-2">{{ ungroupedCount }} 人</span>
                        </h3>
                        <button
                            @click="$emit('toggle-collapse', !collapsed)"
                            class="btn btn-ghost btn-sm btn-circle ml-auto"
                            :title="collapsed ? '展開' : '收合'"
                        >
                            <LucideIcon
                                :name="collapsed ? 'ChevronsRight' : 'ChevronsLeft'"
                                class="w-4 h-4"
                            />
                        </button>
                    </div>

                    <div
                        v-if="!collapsed"
                        class="flex-1 overflow-y-auto space-y-3 p-1"
                        @drop="$emit('unassigned-drop', $event)"
                        @dragover.prevent
                        @dragenter.prevent
                    >
                        <div class="sticky top-0 bg-base-100 pb-2 z-10">
                            <label class="input input-bordered input-sm flex items-center gap-2">
                                <LucideIcon name="Search" class="w-4 h-4 text-base-content/60" />
                                <input
                                    :value="ungroupedSearch"
                                    type="text"
                                    class="grow"
                                    placeholder="搜尋姓名或座號"
                                    @input="$emit('update:ungroupedSearch', ($event.target as HTMLInputElement).value)"
                                />
                                <button
                                    v-if="ungroupedSearch"
                                    type="button"
                                    class="btn btn-xs btn-ghost"
                                    @click="$emit('update:ungroupedSearch', '')"
                                >
                                    清除
                                </button>
                            </label>
                            <div class="mt-3 flex items-center justify-between text-xs text-base-content/70">
                                <span>已選 {{ selectedStudentIds.length }} 人</span>
                                <button
                                    type="button"
                                    class="btn btn-ghost btn-xs"
                                    :disabled="selectedStudentIds.length === 0"
                                    @click="$emit('clear-selection')"
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
                            @dragstart="$emit('drag-start', student.id, 'unassigned', $event)"
                            @dragend="$emit('drag-end', $event)"
                        >
                            <div class="flex items-start gap-3 flex-1">
                                <input
                                    v-if="canModifyGroups"
                                    type="checkbox"
                                    class="checkbox checkbox-sm mt-1"
                                    :checked="selectedStudentIds.includes(student.id)"
                                    @click.stop="$emit('toggle-student-selection', student.id)"
                                />
                                <div class="font-medium">{{ student.name }}</div>
                                <div class="text-sm text-base-content/70">座號 {{ student.id }}</div>
                            </div>
                            <div class="text-sm font-semibold text-primary">
                                {{ student.totalScore }}分
                            </div>
                        </div>

                        <div v-if="filteredUngroupedStudents.length === 0" class="text-center text-base-content/50 py-8">
                            所有學生都已分組
                        </div>
                    </div>
                    <div v-if="collapsed" class="flex justify-center items-center h-full">
                        <LucideIcon name="Users" class="w-8 h-8 text-base-content/30" />
                    </div>
                </template>

                <template v-else>
                    <div class="flex items-center justify-between mb-4">
                        <h3
                            v-if="!collapsed"
                            class="card-title text-base flex items-center whitespace-nowrap"
                        >
                            <LucideIcon name="Trophy" class="w-5 h-5 mr-2" />
                            即時積分榜
                        </h3>
                        <button
                            @click="$emit('toggle-collapse', !collapsed)"
                            class="btn btn-ghost btn-sm btn-circle ml-auto"
                            :title="collapsed ? '展開' : '收合'"
                        >
                            <LucideIcon
                                :name="collapsed ? 'ChevronsRight' : 'ChevronsLeft'"
                                class="w-4 h-4"
                            />
                        </button>
                    </div>
                    <div v-if="!collapsed" class="flex-1 overflow-y-auto">
                        <TransitionGroup name="leaderboard" tag="div" class="space-y-2">
                            <div
                                v-for="(group, index) in leaderboardGroups"
                                :key="group.id"
                                :class="[
                                    'p-3 rounded-lg flex items-center gap-3 transition-all',
                                    index === 0
                                        ? 'bg-amber-100 border-2 border-amber-400'
                                        : 'bg-base-200',
                                ]"
                            >
                                <div
                                    class="text-lg font-bold w-6 text-center"
                                    :class="{
                                        'text-amber-500': index === 0,
                                        'text-slate-400': index > 2,
                                    }"
                                >
                                    {{ index + 1 }}
                                </div>
                                <div
                                    class="w-4 h-4 rounded-full shrink-0"
                                    :style="{ backgroundColor: group.color }"
                                ></div>
                                <div class="font-semibold text-sm truncate flex-1">
                                    {{ group.name }}
                                </div>
                                <div
                                    v-if="showGroupTotalScores"
                                    class="text-lg font-bold text-primary"
                                >
                                    {{ group.totalScore }}
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>
                    <div v-if="collapsed" class="flex justify-center items-center h-full">
                        <LucideIcon name="Trophy" class="w-8 h-8 text-base-content/30" />
                    </div>
                </template>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import LucideIcon from '~/components/LucideIcon.vue'
import type { Student, Group } from '~/types/class'

defineProps<{
    collapsed: boolean
    groupingActive: boolean
    ungroupedSearch: string
    ungroupedCount: number
    filteredUngroupedStudents: Student[]
    selectedStudentIds: string[]
    canModifyGroups: boolean
    leaderboardGroups: Group[]
    showGroupTotalScores: boolean
}>()

defineEmits<{
    (e: 'toggle-collapse', value: boolean): void
    (e: 'update:ungroupedSearch', value: string): void
    (e: 'clear-selection'): void
    (e: 'drag-start', studentId: string, zone: string, event: DragEvent): void
    (e: 'drag-end', event: DragEvent): void
    (e: 'toggle-student-selection', studentId: string): void
    (e: 'unassigned-drop', event: DragEvent): void
}>()
</script>
