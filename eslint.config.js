// Flat ESLint config for AlphaBeacon web.
//
// Carries the repo's load-bearing local rules via an inline plugin named 'ab':
//   ab/no-raw-color — semantic design tokens only in feature/ab component code
//   ab/no-network   — the app is static; no network APIs or absolute http(s) URLs under src/
// guard-static (scripts/guard-static.ts) and the e2e zero-network assert back these up in CI.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Shared patterns — each regex is defined exactly once and reused below
const HEX_COLOR_RE = /#[0-9a-fA-F]{3,8}\b/
const TAILWIND_PALETTE_RE =
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/
const HTTP_URL_RE = /https?:\/\//
const NETWORK_GLOBALS = new Set(['fetch', 'XMLHttpRequest', 'EventSource', 'WebSocket'])

const templateElementValue = (node) => node.value.cooked ?? node.value.raw

/** @type {import('eslint').Rule.RuleModule} */
const noRawColor = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw hex colors and Tailwind palette classes in feature/ab code; semantic design tokens only',
    },
    schema: [],
    messages: {
      rawColor: 'Semantic tokens only (design law) — e.g. bg-primary, text-muted-foreground.',
    },
  },
  create(context) {
    const checkValue = (node, value) => {
      if (typeof value !== 'string') return
      if (HEX_COLOR_RE.test(value) || TAILWIND_PALETTE_RE.test(value)) {
        context.report({ node, messageId: 'rawColor' })
      }
    }
    return {
      Literal(node) {
        checkValue(node, node.value)
      },
      TemplateElement(node) {
        checkValue(node, templateElementValue(node))
      },
    }
  },
}

/** @type {import('eslint').Rule.RuleModule} */
const noNetwork = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow browser network APIs and absolute http(s) URL literals anywhere under src/',
    },
    schema: [],
    messages: {
      network:
        'This app is static — no network APIs or absolute http(s) URLs under src/ (guard-static also enforces this).',
    },
  },
  create(context) {
    const checkStringValue = (node, value) => {
      if (typeof value !== 'string') return
      if (HTTP_URL_RE.test(value) && !value.includes('w3.org')) {
        context.report({ node, messageId: 'network' })
      }
    }
    return {
      // Report fetch/XMLHttpRequest/EventSource/WebSocket used as a call, new,
      // or member target. Checking the parent node type is enough to skip TS
      // type positions and object-literal property keys.
      Identifier(node) {
        if (!NETWORK_GLOBALS.has(node.name)) return
        const parent = node.parent
        if (!parent) return
        const isCallOrNewTarget =
          (parent.type === 'CallExpression' || parent.type === 'NewExpression') &&
          parent.callee === node
        const isMemberUsage =
          parent.type === 'MemberExpression' &&
          (parent.object === node || (!parent.computed && parent.property === node))
        if (isCallOrNewTarget || isMemberUsage) {
          context.report({ node, messageId: 'network' })
        }
      },
      Literal(node) {
        checkStringValue(node, node.value)
      },
      TemplateElement(node) {
        checkStringValue(node, templateElementValue(node))
      },
    }
  },
}

// Local plugin — defined inline so the design law and the static law travel
// with the repo instead of a published package.
const ab = {
  meta: {
    name: 'ab',
    version: '1.0.0',
  },
  rules: {
    'no-raw-color': noRawColor,
    'no-network': noNetwork,
  },
}

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'test-results',
      'playwright-report',
      'cdk.out',
      '.agent',
      '.agents',
      'skills',
      'src/components/ui', // CLI-managed shadcn output — never hand-edited, exempt from lint
      'public',
    ],
  },
  // Base: JS + TS recommended for every TypeScript source
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  // App code runs in the browser and gets the React rules
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // Node-side code: scripts, e2e, infra, and the root config files
  {
    files: [
      'scripts/**/*.{ts,tsx}',
      'e2e/**/*.{ts,tsx}',
      'infra/**/*.{ts,tsx}',
      'playwright.config.ts',
      'vite.config.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  // The static law: no network anywhere under src/
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { ab },
    rules: {
      'ab/no-network': 'error',
    },
  },
  // The design law: semantic tokens only in features and ab compositions
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/components/ab/**/*.{ts,tsx}'],
    plugins: { ab },
    rules: {
      'ab/no-raw-color': 'error',
    },
  },
  // Features read through DataProvider hooks, never entities directly
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/data/entities/*', '**/data/entities/*'],
              message: 'Read through DataProvider hooks (src/data/provider.tsx) instead.',
            },
          ],
        },
      ],
    },
  },
  // These files legitimately export hooks/values beside components
  {
    files: ['src/data/**/*.{ts,tsx}', 'src/routes.tsx', 'src/lib/theme.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
