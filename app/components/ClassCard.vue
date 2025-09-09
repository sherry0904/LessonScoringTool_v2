<template>
    <div class="card w-72 bg-white shadow-xl hover:scale-105 transition cursor-pointer">
        <div class="card-body">
            <h2 class="card-title">{{ classData.name }}</h2>
            <p>學生數：{{ classData.students.length }}</p>
        </div>
    </div>
</template>
<script setup lang="ts">
defineProps<{ classData: any }>()
</script>
