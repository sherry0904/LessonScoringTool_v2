<template>
    <div class="modal" :class="{ 'modal-open': isOpen }">
        <div class="modal-box">
            <h3 class="font-bold text-lg">{{ title }}</h3>
            <p class="py-4 whitespace-pre-wrap">{{ message }}</p>
            <div class="modal-action">
                <button @click="cancel" class="btn btn-ghost">
                    {{ cancelText }}
                </button>
                <button @click="confirm" class="btn btn-primary">
                    {{ confirmText }}
                </button>
            </div>
        </div>
        <label class="modal-backdrop" @click="cancel"></label>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface ConfirmDialogOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
}

const props = withDefaults(
    defineProps<{
        title: string
        message: string
        confirmText?: string
        cancelText?: string
    }>(),
    {
        confirmText: '確認',
        cancelText: '取消',
    },
)

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()

const isOpen = ref(false)

const open = () => {
    isOpen.value = true
}

const close = () => {
    isOpen.value = false
}

const confirm = () => {
    emit('confirm')
    close()
}

const cancel = () => {
    emit('cancel')
    close()
}

defineExpose({
    open,
    close,
})
</script>
