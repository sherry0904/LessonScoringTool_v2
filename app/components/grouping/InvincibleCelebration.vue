<template>
    <Teleport to="body">
        <transition name="celebration-fade">
            <div v-if="visible" class="celebration-overlay" role="status" aria-live="assertive">
                <div class="celebration-backdrop"></div>
                <div class="celebration-content">
                    <div class="glow-ring"></div>
                    <div class="star-stack">
                        <span class="star-icon">★</span>
                        <span class="star-shadow">★</span>
                    </div>
                    <p class="subtitle">Invincible Mode Activated</p>
                    <h2 class="headline">{{ groupName }} 進入無敵星星！</h2>
                    <p class="details">
                        接下來
                        <strong>{{ duration }}</strong>
                        秒每次加分 =
                        <strong>+{{ pointsPerClick }}</strong>
                        分
                    </p>
                    <button class="dismiss-btn" type="button" @click="$emit('close')">
                        收到！
                    </button>
                </div>
                <div class="particle-layer">
                    <span
                        v-for="index in 14"
                        :key="index"
                        :class="['particle', `particle-${index}`]"
                    ></span>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean
    groupName: string
    duration: number
    pointsPerClick: number
}>()

defineEmits<{
    (event: 'close'): void
}>()
</script>

<style scoped>
.celebration-overlay {
    position: fixed;
    z-index: 1400;
    display: flex;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    inset: 0;
    pointer-events: auto;
}

.celebration-backdrop {
    position: absolute;
    animation: backdropPulse 1.4s ease-in-out infinite alternate;
    backdrop-filter: blur(8px);
    background: radial-gradient(circle at center, rgba(255, 220, 140, 0.55), rgba(17, 17, 17, 0.9));
    inset: 0;
}

.celebration-content {
    position: relative;
    z-index: 2;
    overflow: hidden;
    width: min(90vw, 540px);
    padding: 3rem 2.75rem;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 28px;
    background: linear-gradient(145deg, rgba(26, 26, 28, 0.92), rgba(55, 55, 65, 0.88));
    box-shadow:
        0 40px 90px rgba(0, 0, 0, 0.35),
        0 0 120px rgba(255, 214, 102, 0.4);
    color: #fffbea;
    text-align: center;
}

.glow-ring {
    position: absolute;
    animation: glowPulse 1.6s ease-in-out infinite alternate;
    background: radial-gradient(circle, rgba(255, 209, 102, 0.3) 0%, rgba(255, 209, 102, 0) 65%);
    filter: blur(14px);
    inset: -25%;
}

.star-stack {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
}

.star-icon {
    animation: starBurst 1.2s ease-out;
    background: linear-gradient(135deg, #ffe066 10%, #ffa600 70%, #ff6b00 100%);
    -webkit-background-clip: text;
    color: transparent;
    filter: drop-shadow(0 12px 30px rgba(255, 174, 66, 0.5));
    font-size: clamp(3.5rem, 10vw, 5.5rem);
}

.star-shadow {
    position: absolute;
    animation: starGlow 1.2s ease-in-out infinite alternate;
    color: rgba(255, 221, 122, 0.45);
    filter: blur(6px);
    font-size: clamp(3.5rem, 10vw, 5.5rem);
    transform: scale(1.12);
}

.subtitle {
    margin-bottom: 1.2rem;
    color: rgba(255, 249, 235, 0.75);
    font-size: 0.75rem;
    letter-spacing: 0.42em;
    text-transform: uppercase;
}

.headline {
    margin-bottom: 0.75rem;
    font-size: clamp(1.85rem, 4.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.2;
}

.details {
    margin-bottom: 2rem;
    color: rgba(255, 249, 235, 0.85);
    font-size: clamp(1rem, 3vw, 1.15rem);
}

.details strong {
    color: #ffe78f;
    font-weight: 700;
}

.dismiss-btn {
    position: relative;
    padding: 0.65rem 2.4rem;
    border: none;
    border-radius: 999px;
    background: linear-gradient(135deg, #ffe066, #ffb347);
    box-shadow: 0 12px 24px rgba(255, 183, 77, 0.35);
    color: #1a1a1b;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    transition:
        transform 0.18s ease-out,
        box-shadow 0.18s ease-out;
}

.dismiss-btn:hover {
    box-shadow: 0 18px 32px rgba(255, 183, 77, 0.45);
    transform: translateY(-2px) scale(1.02);
}

.dismiss-btn:active {
    transform: translateY(0) scale(0.99);
}

.particle-layer {
    position: absolute;
    overflow: hidden;
    inset: 0;
    pointer-events: none;
}

.particle {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    animation: particleDrift 1.6s ease-out forwards;
    background: linear-gradient(135deg, #fff2b8, #ffb347);
    opacity: 0;
}

.particle::after {
    position: absolute;
    border-radius: inherit;
    background: inherit;
    content: '';
    filter: blur(4px);
    inset: 0;
    opacity: 0.6;
}

/* Particle positions & delays */
.particle-1 {
    top: 18%;
    left: 24%;
    --x: -60px;
    --y: -180px;
    animation-delay: 0.05s;
}

.particle-2 {
    top: 32%;
    left: 12%;
    --x: -110px;
    --y: -160px;
    animation-delay: 0.1s;
}

.particle-3 {
    top: 12%;
    left: 52%;
    --x: 40px;
    --y: -190px;
    animation-delay: 0.18s;
}

.particle-4 {
    top: 26%;
    left: 74%;
    --x: 120px;
    --y: -170px;
    animation-delay: 0.15s;
}

.particle-5 {
    top: 44%;
    left: 86%;
    --x: 150px;
    --y: -150px;
    animation-delay: 0.22s;
}

.particle-6 {
    top: 68%;
    left: 78%;
    --x: 120px;
    --y: -120px;
    animation-delay: 0.28s;
}

.particle-7 {
    top: 78%;
    left: 58%;
    --x: 80px;
    --y: -110px;
    animation-delay: 0.32s;
}

.particle-8 {
    top: 82%;
    left: 24%;
    --x: -90px;
    --y: -120px;
    animation-delay: 0.38s;
}

.particle-9 {
    top: 64%;
    left: 14%;
    --x: -130px;
    --y: -140px;
    animation-delay: 0.42s;
}

.particle-10 {
    top: 52%;
    left: 46%;
    --x: 50px;
    --y: -150px;
    animation-delay: 0.26s;
}

.particle-11 {
    top: 36%;
    left: 58%;
    --x: 90px;
    --y: -180px;
    animation-delay: 0.34s;
}

.particle-12 {
    top: 16%;
    left: 68%;
    --x: 110px;
    --y: -200px;
    animation-delay: 0.3s;
}

.particle-13 {
    top: 48%;
    left: 32%;
    --x: -40px;
    --y: -160px;
    animation-delay: 0.48s;
}

.particle-14 {
    top: 70%;
    left: 40%;
    --x: 10px;
    --y: -140px;
    animation-delay: 0.52s;
}

/* Animations */
@keyframes celebrationFadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes backdropPulse {
    from {
        opacity: 0.52;
    }
    to {
        opacity: 0.74;
    }
}

@keyframes glowPulse {
    from {
        opacity: 0.28;
        transform: scale(1);
    }
    to {
        opacity: 0.45;
        transform: scale(1.08);
    }
}

@keyframes starBurst {
    0% {
        opacity: 0;
        transform: scale(0.4) rotate(-12deg);
    }
    60% {
        opacity: 1;
        transform: scale(1.1) rotate(6deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }
}

@keyframes starGlow {
    from {
        opacity: 0.38;
    }
    to {
        opacity: 0.65;
    }
}

@keyframes particleDrift {
    0% {
        opacity: 0;
        transform: translate3d(0, 0, 0) scale(0.6);
    }
    20% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: translate3d(var(--x, 0px), var(--y, -140px), 0) scale(1.2);
    }
}

.celebration-fade-enter-active,
.celebration-fade-leave-active {
    transition: opacity 0.25s ease;
}

.celebration-fade-enter-from,
.celebration-fade-leave-to {
    opacity: 0;
}

@media (max-width: 640px) {
    .celebration-content {
        padding: 2.4rem 1.65rem 2.2rem;
    }

    .details {
        margin-bottom: 1.6rem;
    }
}
</style>
