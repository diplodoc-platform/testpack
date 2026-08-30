---
title: HTML Extension
description: HTML embedding extension for Diplodoc — safe inline HTML via container directive with sandboxed isolation strategies
stage: preview
tags:
  - html
  - embedding
  - iframe
  - sandbox
  - extension
---

# {{ html_info.package }}

{{ html_info.description }}

The HTML extension allows embedding arbitrary HTML content inside Markdown documents via the `::: html` container directive. It renders that HTML safely in the browser using one of three isolation strategies: `srcdoc`, `shadow`, or `isolated`.

## Overview

The `@diplodoc/html-extension` package provides a customizable HTML embedding solution for YFM-aware applications. It integrates with the Diplodoc transformer pipeline via a MarkdownIt plugin that registers the `::: html` container directive.

Key features:

- Container directive syntax via `@diplodoc/directive` integration
- Three embedding modes: `srcdoc` (iframe srcdoc), `shadow` (ShadowRoot), `isolated` (cross-origin iframe)
- Built-in HTML sanitizer with extended CSS whitelist and mutation XSS defense
- Browser runtime with auto-initialization on `DOMContentLoaded`
- React integration via hooks and `EmbeddedContentRuntime` component
- PostMessage-based RPC adapter for cross-origin isolation

{% note info "Directive syntax" %}

The extension uses the `::: html ... :::` container block directive provided by `@diplodoc/directive`. It is not a fenced code block and not a Liquid tag.

{% endnote %}

## Package Information

- **Package:** `{{ html_info.package }}`
- **Version:** `{{ html_info.version }}`
- **Description:** {{ html_info.description }}
- **License:** MIT

### Dependencies

{% for dep in html_info.dependencies %}
- {{ dep }}
{% endfor %}

### Exports

{% for export in html_info.exports %}
- `{{ export }}`
{% endfor %}

## Embedding Modes

The extension supports three isolation strategies, selected via the `embeddingMode` plugin option.

| Mode | Element | Isolation | Sanitization | Use case |
| --- | --- | --- | --- | --- |
| `srcdoc` | `<iframe srcdoc>` | Same-origin iframe boundary | Head + body | Default, safe embedded content |
| `shadow` | `<div>` with ShadowRoot | `all: initial` CSS isolation | Body only | Experimental, less runtime jitter |
| `isolated` | `<iframe>` cross-origin | Separate origin SOP | Not applied | Unsafe/widget content |

### Srcdoc mode

The default mode embeds HTML via `<iframe srcdoc="...">`. The iframe inherits the parent origin and CSP. CSS is isolated by the iframe boundary. Sanitization is strongly recommended.

```html
<iframe srcdoc="<!DOCTYPE html>..." frameborder="0" style="width:100%" data-yfm-sandbox-mode="srcdoc">
```

### Shadow mode

Experimental mode embeds via a ShadowRoot attached to a `<div>`. Uses `all: initial` at the shadow boundary to isolate inheritable global styles. Less runtime jitter than `srcdoc`.

```html
<div style="width:100%;all:initial;" data-yfm-sandbox-mode="shadow" data-yfm-sandbox-content="<html>...">
```

### Isolated mode

Embeds via an iframe hosted on a separate origin so Same-Origin-Policy does not apply. Scripts cannot access parent context, storage, or cookies. Requires hosting the `runtime.html` IFrame runtime on a different origin. Communicates via postMessage RPC.

```html
<iframe frameborder="0" style="width:100%" data-yfm-sandbox-mode="isolated" data-yfm-sandbox-content="<html>...">
```

## Directive Syntax

The `::: html` container directive wraps raw HTML content between the opening `::: html` and closing `:::` markers.

```markdown
::: html

<div style="background:#ffe;padding:10px;">
  <p>Hello from embedded HTML!</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>

:::
```

The directive name is `html`. It is registered as a `code_block` type with container `tag: 'iframe'`. The token type emitted depends on `embeddingMode`:

| Embedding mode | Token type |
| --- | --- |
| `srcdoc` | `yfm_html_block` |
| `shadow` | `yfm_html_block_shadow` |
| `isolated` | `yfm_html_block_isolated` |

## Data Attributes

The runtime finds embeds via `data-yfm-sandbox-mode` attributes on DOM elements.

| Attribute | Mode | Purpose |
| --- | --- | --- |
| `data-yfm-sandbox-mode` | All | Isolation strategy: `srcdoc`, `shadow`, or `isolated` |
| `data-yfm-sandbox-content` | shadow, isolated | HTML content string to inject |
| `data-yfm-sandbox-base-target` | isolated | `<base target>` value |
| `data-yfm-sandbox-preferred-isolated-host-uri` | isolated | Cross-origin iframe host URL |
| `data-yfm-embed-id` | All | Runtime-generated unique ID (prevents re-initialization) |

## Configuration Options

The `transform()` function accepts a `PluginOptions` object with the following fields.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `embeddingMode` | `string` | `srcdoc` | Isolation strategy |
| `runtimeJsPath` | `string` | `_assets/html-extension.js` | Runtime script path |
| `containerClasses` | `string` | (empty) | Class names on embed host element |
| `bundle` | `boolean` | `true` | Copy runtime JS into output directory |
| `isolatedSandboxHost` | `string` | (none) | URL of cross-origin iframe runtime |
| `sanitize` | `object` | Default sanitizer | Head/body sanitizers |
| `head` | `string` | Derived | Raw `<head>` content for srcdoc |
| `sandbox` | `boolean\|string` | (none) | Iframe `sandbox` attribute |

## API Exports

The package exports from multiple subpaths.

| Subpath | Export | Description |
| --- | --- | --- |
| `.` | `transform` | MarkdownIt plugin with directive registration |
| `.` | `getStyles` | Serialize StylesObject to CSS text |
| `.` | `htmlBlockDefaultSanitizer` | Default head/body sanitizer |
| `./runtime` | `HtmlController` | Browser runtime root controller |
| `./react` | `useDiplodocEmbeddedContent` | React hook for SPA initialization |
| `./react` | `EmbeddedContentRuntime` | React component for declarative usage |
| `./utils` | `Disposable` | Lifecycle management utility |
| `./utils` | `TaskQueue` | Serialized async task execution |
| `./utils` | `setupRuntimeConfig` | Configure runtime behavior |

## Sanitizer

The built-in HTML sanitizer wraps `@diplodoc/transform/lib/sanitize` with an extended CSS whitelist and a `parse5`-based canonicalizer to defend against mutation XSS.

```typescript
import {htmlBlockDefaultSanitizer} from '@diplodoc/html-extension';

const sanitize = htmlBlockDefaultSanitizer;
// sanitize.head('<head>...') -> sanitized head HTML
// sanitize.body('<body>...') -> sanitized body HTML
```

The sanitizer canonicalizes HTML with `parse5` (`parseFragment` -> `stripRawTextChildren` -> `serialize`) to neutralize mutation XSS in raw-text elements like `iframe`, `noscript`, `xmp`, `noembed`, `noframes`, and `plaintext`.

### Extended CSS whitelist

The sanitizer extends the default transform CSS whitelist with properties for modern layout:

| Category | Properties |
| --- | --- |
| Flexbox | `display: flex`, `flex-direction`, `flex-wrap`, `justify-content`, `align-items` |
| Grid | `display: grid`, `grid-template-columns`, `grid-template-rows` |
| Columns | `column-count`, `column-gap`, `column-width` |
| Position | `position`, `top`, `right`, `bottom`, `left`, `z-index` |
| Visual | `opacity`, `overflow`, `line-height`, `object-fit` |

## Runtime

The browser runtime auto-initializes on `DOMContentLoaded`. It finds all embeds via `querySelectorAll` using three selectors:

| Selector | Controller |
| --- | --- |
| `iframe[data-yfm-sandbox-mode=srcdoc]` | `SrcDocIFrameController` |
| `div[data-yfm-sandbox-mode=shadow]` | `ShadowRootController` |
| `iframe[data-yfm-sandbox-mode=isolated]` | `EmbeddedIFrameController` |

```typescript
import {HtmlController} from '@diplodoc/html-extension/runtime';

// Auto-initializes on DOMContentLoaded
// Manual initialization:
// HtmlController.initialize({classNames: ['custom'], styles: {color: 'red'}});
```

The runtime applies root classNames and styles to each embed's root element (iframe body or host div). For `srcdoc` mode, it also wires anchor link scrolling and height synchronization via `ResizeObserver`.

## React Integration

The React layer provides hooks and a component for SPA-style re-initialization.

```typescript
import {
    useDiplodocEmbeddedContentController,
    useDiplodocEmbeddedContent,
    EmbeddedContentRuntime,
} from '@diplodoc/html-extension/react';

// Hook: get the root controller
const controller = useDiplodocEmbeddedContentController();

// Hook: re-initialize on every render (SPA navigation)
useDiplodocEmbeddedContent({classNames: ['custom']});

// Component: declarative wrapper
<EmbeddedContentRuntime isolatedSandboxHostURIOverride="https://cdn.example.com" />
```

## RPC Adapter

The `isolated` mode uses a postMessage-based RPC protocol between the host page and the cross-origin iframe.

| Component | Side | Purpose |
| --- | --- | --- |
| `RPCConsumer` | Host | Dispatches calls and receives events |
| `APIPublisher` | Iframe | Handles commands and dispatches events |
| `PostMessageChannel` | Both | Message transport over `window.postMessage` |

Commands: `setStyles`, `setClassNames`, `replaceHTML`, `setBaseTarget`. Events: `resize`.

{% cut "Security considerations" %}

The `isolated` mode uses `targetOrigin: '*'` for postMessage, relying on the separate-origin isolation model for security. This is acceptable because the iframe content cannot access the parent's origin, storage, or cookies. The `srcdoc` and `shadow` modes apply sanitization to defend against XSS within the embedded content.

{% endcut %}

## Quickstart

```typescript
import MarkdownIt from 'markdown-it';
import {transform} from '@diplodoc/html-extension';

const md = new MarkdownIt();
md.use(transform({
    embeddingMode: 'srcdoc',
    runtimeJsPath: '_assets/html-extension.js',
    containerClasses: 'custom-html-container',
    bundle: true,
}));

const html = md.render('::: html\n<div>Hello!</div>\n:::');
```

## Navigation

See the [Cut Extension](./cut-extension.md), [File Extension](./file.md), and [Page Constructor](./page-constructor.md) pages for other extension syntax features.
