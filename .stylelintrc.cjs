module.exports = {
    extends: [
        'stylelint-config-recommended-scss',
        'stylelint-config-recommended-vue/scss',
        'stylelint-config-idiomatic-order', // 規則順序
    ],
    plugins: ['stylelint-order', 'stylelint-scss'],
    rules: {
        'selector-pseudo-element-no-unknown': [
            // 忽略对::v-deep的校验
            true,
            {
                ignorePseudoElements: ['v-deep'],
            },
        ],
        'scss/dollar-variable-pattern': null,
        'at-rule-no-unknown': null, // 禁用一般 CSS 規則，避免與 SCSS 衝突
        'scss/at-rule-no-unknown': [
            true,
            {
                ignoreAtRules: [
                    'use',
                    'forward',
                    'import',
                    'mixin',
                    'include',
                    'function',
                    'return',
                    'if',
                    'else',
                    'for',
                    'while',
                    'each',
                    'warn',
                    'debug',
                    'error',
                    'extend', // 如果有使用 @extend
                    'tailwind', // 如果使用 Tailwind CSS
                    'apply',
                    'responsive',
                    'variants',
                    'screen',
                    'layer',
                ],
            },
        ],
        'no-descending-specificity': null, // 關閉此規則
        'block-no-empty': true, // 禁止空塊
        'scss/at-import-no-partial-leading-underscore': null, // 測試用，先關閉此規則
    },
    ignoreFiles: [
        './node_modules/**/*.{css,scss,sass}',
        './dist/**/*.{css,scss,sass}',
        './public/old/**/*.{css,scss,sass}', // 忽略舊的 CSS 文件
    ],
}
