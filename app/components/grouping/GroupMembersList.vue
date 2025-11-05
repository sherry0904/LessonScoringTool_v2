<template>
    <div
        :class="[
            'flex-1',
            isEditMode ? 'grid grid-cols-1 md:grid-cols-2 gap-2' : 'flex flex-col gap-2',
        ]"
    >
        <div
            v-for="(member, index) in members"
            :key="member.id"
            :class="memberClass(member, index)"
            :draggable="canModify"
            @dragstart="$emit('drag-start', member.id, groupId, $event)"
            @dragend="$emit('drag-end')"
            @dragover.prevent="$emit('member-drag-over', groupId, index, $event)"
            @drop.stop="$emit('member-drop', groupId, index)"
        >
            <template v-if="isEditMode">
                <div class="px-3 py-2 flex flex-col gap-1">
                    <div class="text-xs text-base-content/70">座號 {{ member.id }}</div>
                    <div class="font-medium text-sm">{{ member.name }}</div>
                </div>
            </template>
            <template v-else>
                <div class="p-2 flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                        <div class="font-medium text-sm flex items-center">
                            {{ member.name }}
                            <span
                                v-if="!member.isPresent"
                                class="ml-2 px-2 py-0.5 rounded bg-gray-300 text-xs text-gray-600"
                            >
                                今日缺席
                            </span>
                        </div>
                        <div class="text-xs text-base-content/70">座號 {{ member.id }}</div>
                    </div>
                    <div class="flex justify-end items-center gap-2">
                        <template v-if="groupingActive">
                            <div v-if="showIndividualScores" class="flex items-center gap-1 text-xs">
                                <span class="opacity-60">{{ baseScores[member.id] ?? '' }}</span>
                                <span class="opacity-60">分</span>
                                <LucideIcon name="ArrowRight" class="w-3 h-3 text-success" />
                                <span
                                    :class="[
                                        'text-success font-bold',
                                        studentScoreAnimation?.[member.id] ?? '',
                                    ]"
                                >
                                    {{
                                        (baseScores[member.id] ?? 0) +
                                        (sessionScores[member.id] ?? 0)
                                    }}
                                </span>
                                <span class="text-success">分</span>
                            </div>
                            <div v-if="allowIndividualScoring" class="flex gap-1">
                                <button
                                    class="btn btn-xs btn-circle btn-outline btn-success"
                                    title="個人加分"
                                    @click="$emit('add-individual-score', member.id, 1)"
                                >
                                    +
                                </button>
                                <button
                                    class="btn btn-xs btn-circle btn-outline btn-error"
                                    title="個人扣分"
                                    @click="$emit('add-individual-score', member.id, -1)"
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
</template>

<script setup lang="ts">
import LucideIcon from '~/components/LucideIcon.vue'
import type { Student } from '~/types/class'

const props = defineProps<{
    groupId: string
    members: Student[]
    isEditMode: boolean
    canModify: boolean
    groupingActive: boolean
    showIndividualScores: boolean
    allowIndividualScoring: boolean
    baseScores: Record<string, number>
    sessionScores: Record<string, number>
    studentScoreAnimation?: Record<string, string | null>
    dropIndicator?: { groupId: string | null; index: number | null } | null
}>()

const memberClass = (member: Student, index: number) => {
    return [
        'rounded transition-all',
        props.canModify
            ? 'cursor-move border border-base-200 bg-base-100'
            : member.isPresent
              ? 'bg-base-200'
              : 'bg-gray-200 text-gray-400 opacity-60',
        props.dropIndicator?.groupId === props.groupId &&
        props.dropIndicator.index === index
            ? 'ring-2 ring-primary ring-offset-2'
            : '',
        !props.canModify && member.isPresent ? 'hover:bg-base-300' : '',
    ]
}

defineEmits<{
    (e: 'drag-start', studentId: string, groupId: string | null, event: DragEvent): void
    (e: 'drag-end'): void
    (e: 'member-drag-over', groupId: string, index: number, event: DragEvent): void
    (e: 'member-drop', groupId: string, index: number): void
    (e: 'add-individual-score', studentId: string, delta: number): void
}>()
</script>
