# GEMINI 專案助理指引

## 專案背景

本專案為「班級經營動力站」現代化班級管理系統，採用 Nuxt 4、Pinia、Tailwind CSS、TypeScript 與 Vue 3 技術，協助教師進行班級、學生、分組、作業、統計等多元管理。

## Gemini CLI 使用建議

- **請以繁體中文回應所有指令與說明。**
- 回答時務必考慮本專案的技術棧（Nuxt 4、Pinia、TypeScript、Tailwind CSS、Vue 3）。
- 優先提供長遠、穩健、型別安全的解決方案，而非僅求快速修補。
- 回覆內容應具體、可執行，並盡量結合專案現有結構與元件。
- 若涉及 UI/UX，請參考現有 Tailwind 與 daisyUI 風格。
- 若需範例程式碼，請以 TypeScript 與 Composition API 為主。
- 若遇到資料結構、型別、狀態管理等問題，請優先參考 `app/types/` 及 `app/stores/` 內容。

## 常用開發指令

- 安裝依賴：`npm install`
- 啟動開發伺服器：`npm run dev`
- 建置正式版：`npm run build`
- 預覽正式版：`npm run preview`
- 格式化程式碼：`npm run format`
- 樣式檢查：`npm run lint:style`

## 互動建議

- 若需新增功能，請先簡要說明設計思路與檔案位置，再進行程式碼修改。
- 若需重構，請說明重構原因與預期效益。
- 若需協助除錯，請先列出推論步驟與可能原因。
- 若需協助文件撰寫，請以繁體中文並結合專案實際情境。

## 語言與格式

- 所有 CLI 回應、說明、註解、文件皆以繁體中文為主。
- 若需英文關鍵字或專有名詞，請保留原文並加註中文說明。

---

> 本文件為 Gemini CLI 專用，協助 AI 助理更精準地回應本專案需求。
