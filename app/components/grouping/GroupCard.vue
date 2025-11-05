<template>
    <div
        v-bind="$attrs"
        :class="[
            'card bg-base-100 shadow-sm transition-all duration-300 relative',
            isInvincible ? 'invincible-glow' : '',
            invincibleHighlight ? 'invincible-activate-scale' : '',
        ]"
    >
        <div v-if="invincibleBurst" class="invincible-burst-layer">
            <span class="burst-star">⭐</span>
            <span class="burst-star">⭐</span>
            <span class="burst-star">⭐</span>
            <span class="burst-star">⭐</span>
            <span class="burst-star">⭐</span>
            <span class="burst-star">⭐</span>
        </div>

        <div v-if="invincibleHighlight" class="invincible-rings-layer"></div>

        <div
            :class="[
                'card-body flex flex-col gap-2 relative overflow-visible',
                compact ? 'p-2' : 'p-3',
            ]"
        >
            <div v-if="milestoneMessage" class="milestone-floating">
                <span class="milestone-message">{{ milestoneMessage }}</span>
            </div>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    compact: boolean
    isInvincible: boolean
    invincibleBurst: boolean
    invincibleHighlight: boolean
    milestoneMessage?: string | null
}>()
</script>

<style scoped>
@import '@/assets/score-animate.css';

.milestone-floating {
    position: absolute;
    top: -0.75rem;
    left: 1rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    border-radius: 9999px;
    background: linear-gradient(120deg, #fde68a, #f97316);
    color: #78350f;
    font-size: 0.85rem;
    font-weight: 700;
    box-shadow:
        0 12px 16px -8px rgba(249, 115, 22, 0.45),
        0 4px 6px -4px rgba(249, 115, 22, 0.35);
    animation: milestoneBounce 1.8s ease-in-out infinite;
    pointer-events: none;
}

.milestone-floating::before {
    content: '🎉';
    font-size: 1rem;
}

.milestone-floating::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 18px;
    width: 12px;
    height: 12px;
    background: inherit;
    transform: rotate(45deg);
    filter: brightness(0.95);
}

.milestone-message {
    letter-spacing: 0.02em;
}

@keyframes milestoneBounce {
    0%,
    100% {
        transform: translateY(0) scale(1);
    }
    45% {
        transform: translateY(-4px) scale(1.03);
    }
    55% {
        transform: translateY(-2px) scale(0.99);
    }
}
</style>
