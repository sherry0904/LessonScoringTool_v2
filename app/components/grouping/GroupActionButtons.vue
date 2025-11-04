<template>
    <div class="flex items-center gap-2 mt-2">
        <button
            class="btn btn-md flex-1 font-bold text-base px-4 py-1 rounded-full text-white border-none shadow transition-transform hover:scale-105 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 disabled:opacity-50 disabled:hover:scale-100"
            :disabled="disabled"
            @click="$emit('add-positive')"
        >
            {{ positiveLabel }}
        </button>
        <button
            class="btn btn-md flex-1 font-bold text-base px-4 py-1 rounded-full text-white border-none shadow transition-transform hover:scale-105 bg-gradient-to-r from-rose-400 to-red-500 hover:from-rose-500 hover:to-red-600 disabled:opacity-50 disabled:hover:scale-100"
            :disabled="disabled"
            @click="$emit('add-negative')"
        >
            {{ negativeLabel }}
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    positiveLabel: string
    negativeLabel: string
    disabled: boolean
}>()

defineEmits<{
    (e: 'add-positive'): void
    (e: 'add-negative'): void
}>()
</script>
