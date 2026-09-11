---
title: Latex Extension
description: LaTeX math rendering extension for Diplodoc using KaTeX
stage: preview
tags:
  - latex
  - math
  - katex
  - equations
  - extension
---

# {{ latex_info.package }}

{{ latex_info.description }}

The LaTeX extension integrates [KaTeX](https://katex.org/) into the Diplodoc transform pipeline, rendering mathematical formulas from `$...$` inline and `$$...$$` block syntax directly in the browser.

## Overview

The extension has three layers:

1. **Plugin** — markdown-it transform that converts `$...$` and `$$...$$` delimiters into placeholder elements with encoded content
2. **Runtime** — browser-side script that reads encoded content and renders KaTeX HTML
3. **React** — optional `LatexRuntime` component and `useLatex` hook for React integrations

### Key Features

- Inline math via `$...$` delimiters
- Block (display) math via `$$...$$` delimiters
- Server-side validation of LaTeX syntax (optional)
- Client-side rendering via KaTeX runtime bundle
- Configurable CSS classes and KaTeX options
- React integration via `LatexRuntime` component

## Preset Variables

Package: `{{ latex_info.package }}`

Version: `{{ latex_info.version }}`

Description: `{{ latex_info.description }}`

## Syntax

### Inline Math

Use single `$` delimiters for inline equations:

The area of a circle is $\pi r^2$ where $r$ is the radius.

Euler's identity: $e^{i\pi} + 1 = 0$

The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

### Block Math

Use `$$...$$` delimiters for display equations:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

$$
E = mc^2
$$

### Single-line Block

Inline `$$...$$` on one line renders as display math when it starts the line.

## Inline Examples

{#inline-area}

The area of a circle is $\pi r^2$ where $r$ is the radius.

{#inline-euler}

Euler's identity: $e^{i\pi} + 1 = 0$

{#inline-quadratic}

The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

## Block Examples

{#block-integral}

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

{#block-sum}

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$

{#block-energy}

$$
E = mc^2
$$

## Single-line Block

{#single-line-block}

$$ \nabla \times \mathbf{B} = \mu_0 \mathbf{J} $$

## All Inline Formulas

{#all-inline}

The area of a circle is $\pi r^2$ where $r$ is the radius. Euler's identity: $e^{i\pi} + 1 = 0$. The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

## Configuration

The `transform` function accepts the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `classes` | string | `'yfm-latex'` | CSS class applied to rendered elements |
| `bundle` | boolean | `true` | Whether to bundle runtime assets |
| `validate` | boolean | `true` | Validate LaTeX syntax during build |
| `katexOptions` | object | `{}` | Additional KaTeX rendering options |
| `runtime` | string \| object | `'_assets/latex-extension.{js,css}'` | Runtime asset paths |

## Token Types

| Token | Tag | Display Mode | Description |
|-------|-----|--------------|-------------|
| `math_inline` | `span` | `false` | Inline math rendered within text flow |
| `math_block` | `p` | `true` | Block math rendered as display equation |

## Data Attributes

Rendered placeholder elements carry encoded data attributes:

| Attribute | Encoding | Content |
|-----------|----------|---------|
| `data-content` | `encodeURIComponent` | Raw LaTeX source |
| `data-options` | `encodeURIComponent(JSON.stringify)` | KaTeX options JSON |

## Runtime

The runtime script (`_bundle/latex-extension.js`) processes all `.yfm-latex` elements on page load:

- Reads `data-content` and `data-options` via `decodeURIComponent`
- Calls `katex.renderToString()` with decoded content and options
- Sets `innerHTML` on each element with the rendered KaTeX HTML

The runtime uses a JSONP queue pattern (`window.latexJsonp`) for initialization.

## React Integration

The extension provides optional React integration:

| Export | Description |
|--------|-------------|
| `LatexRuntime` | React component that renders LaTeX on mount |
| `useLatex` | Hook returning an async render function |

## API Exports

| Export | Description |
|--------|-------------|
| `@diplodoc/latex-extension` | Main plugin (transform function) |
| `@diplodoc/latex-extension/plugin` | Plugin entry point |
| `@diplodoc/latex-extension/runtime` | Browser runtime |
| `@diplodoc/latex-extension/runtime/styles` | Runtime CSS |
| `@diplodoc/latex-extension/react` | React integration |
| `@diplodoc/latex-extension/hooks` | React hooks |

## Usage Example

```typescript
import {transform} from '@diplodoc/latex-extension';

const plugin = transform({
    bundle: false,
    runtime: {
        script: '_bundle/latex-extension.js',
        style: '_bundle/latex-extension.css',
    },
    katexOptions: {
        strict: false,
    },
});

md.use(plugin, {output: '.'});
```

## Package Information

### Dependencies

{% for dep in latex_info.dependencies %}
- {{ dep }}
{% endfor %}

### Exports

{% for exp in latex_info.exports %}
- {{ exp }}
{% endfor %}

> **Rendering:** LaTeX formulas are rendered client-side by the KaTeX runtime. The build step produces placeholder elements with encoded content; the runtime decodes and renders them into KaTeX HTML.

## TOC Navigation

This page is registered in the sidebar TOC under Syntax → Latex Extension.
