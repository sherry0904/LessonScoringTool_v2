<template>
    <div class="flex justify-between items-start mb-4">
        <div>
            <h1
                class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
                {{ title }}
            </h1>
            <p v-if="description" class="mt-2 text-base-content/70">
                {{ description }}
            </p>
        </div>
        <button @click="goBack" class="btn btn-ghost">
            <LucideIcon name="ArrowLeft" class="w-4 h-4 mr-2" />
            返回
        </button>
    </div>
</template>

<script setup lang="ts">
interface Props {
    title: string
    description?: string
}

defineProps<Props>()

const router = useRouter()
const route = useRoute()

const goBack = () => {
    // 如果當前路由是 /rewards，返回到儀表板首頁
    if (route.path === '/rewards') {
        router.push('/')
    } else {
        // 其他情況使用瀏覽器返回
        router.back()
    }
}
</script>
