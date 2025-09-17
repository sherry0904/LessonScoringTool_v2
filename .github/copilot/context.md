# GitHub Copilot 指引：班級分組計分工具

歡迎，Copilot！本文件旨在提供清晰的指引，幫助你為這個專案提供高品質、符合資深工程師標準的程式碼建議。請嚴格遵守以下原則。

## 專案核心

- **專案名稱：** 班級分組計分工具 (LessonScoringTool-nuxt)
- **目標：** 一款採用現代技術棧的班級管理工具，協助教師管理班級、學生、分組、計分、作業等。
- **核心價值：** 我們追求的是**長遠、穩健、且型別安全**的解決方案。絕不接受臨時性的修補或捷徑。

## 技術棧與規範

- **框架：** Nuxt 4 (Vue 3)
- **狀態管理：** Pinia
- **樣式：** Tailwind CSS + daisyUI
- **語言：** TypeScript (請使用嚴格模式)
- **API 風格：** Vue 3 Composition API (`<script setup lang="ts">`)

---

## 開發金律

1.  **型別安全至上 (Type-Safety First):**
    - **絕不使用 `any` 型別。**
    - 所有變數、函式參數、回傳值都必須有明確的型別。
    - 優先從 `app/types/` 目錄中引用或擴充現有型別。若需建立新類型，請考量其通用性並放置於此目錄。

2.  **狀態管理 (State Management):**
    - **所有跨元件的共享狀態都必須由 Pinia 管理。**
    - Pinia stores 位於 `app/stores/` 目錄。
    - 使用 store 時，請遵循現有模式，例如 `const classesStore = useClassesStore()`。

3.  **元件開發 (Component Development):**
    - **一律使用 Composition API (`<script setup lang="ts">`)。**
    - 元件應保持高內聚、低耦合。
    - Props 定義需有明確的型別，最好加上 `required` 或 `default`。
    - 複雜的邏輯應拆分為可複用的 `composables`。

4.  **樣式與 UI (Styling & UI):**
    - **嚴格遵循 Tailwind CSS 與 daisyUI 的設計系統。**
    - 優先使用 daisyUI 提供的元件樣式 (如 `btn`, `card`, `modal`)。
    - 若需客製化，請使用 Tailwind 的功能類別 (`utility classes`)。
    - 避免撰寫原生 CSS 或使用 `<style scoped>` 處理複雜樣式，除非是極少數的特殊情況。
    - 響應式設計 (`sm:`, `md:`, `lg:`) 是基本要求。

5.  **程式碼風格 (Code Style):**
    - 遵循專案已配置的 Prettier 與 ESLint 規則。
    - 命名應清晰、一致（例如，元件用 `PascalCase`，變數/函式用 `camelCase`）。
    - 優先使用 `computed` 處理衍生狀態，`watch` 用於處理副作用。

---

## 常用程式碼範例

**1. Vue 元件 (Composition API with TypeScript)**

```vue
<template>
  <div>
    <p>{{ greeting }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Student } from '~/types'

interface Props {
  student: Student
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
})

const greeting = computed(() => `Hello, ${props.student.name}`)
</script>
```

**2. Pinia Store 使用**

```typescript
import { useClassesStore } from '~/stores/classes'

const classesStore = useClassesStore()

// 讀取狀態
const currentClass = computed(() => classesStore.currentClass)

// 執行 action
const updateScore = (studentId: string, newScore: number) => {
  if (currentClass.value) {
    classesStore.updateStudentScore(currentClass.value.id, studentId, newScore)
  }
}
```

---

請將以上規範視為最高準則，協助我們共同打造一個高品質、易於維護的專案。
