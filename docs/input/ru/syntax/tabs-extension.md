---
title: Tabs Extension
description: Testpack fixture exercising the @diplodoc/tabs-extension plugin rendering and documentation.
stage: preview
tags:
  - tabs
  - switchable
  - variants
  - extension
---

# Tabs Extension

The `{{ tabs_info.package }}` (v{{ tabs_info.version }}) provides switchable tabs in YFM documentation. It includes a MarkdownIt transform plugin, a runtime controller for interactive behavior, and a React hook for programmatic control.

{{ tabs_info.description }}

## Overview

The tabs extension enables documentation authors to create switchable tab groups in the documentation, allowing readers to switch between different content sections without scrolling.

Key features:

- Liquid syntax `{% list tabs %} ... {% endlist %}`
- Four render variants: regular, radio, dropdown, accordion
- Group synchronization across tab groups
- Tab state persistence via localStorage and URL query
- Custom tab keys via YFM attribute syntax `{#key}`
- React hook for programmatic control

## Syntax

The tabs extension uses Liquid-style `{% list tabs %}` and `{% endlist %}` tags:

```markdown
{% list tabs %}

- Tab 1

  Content for tab 1.

- Tab 2

  Content for tab 2.

{% endlist %}
```

### Variants

You can specify a render variant after `tabs`:

```markdown
{% list tabs radio %}

- Tab A

  Radio variant content.

- Tab B

  Radio variant content.

{% endlist %}
```

### Group synchronization

Add `group=<group_key>` to synchronize active tabs across multiple tab groups:

```markdown
{% list tabs group=platforms %}

- Linux

  Linux content.

- macOS

  macOS content.

{% endlist %}
```

### Custom tab keys

You can set your own keys for tabs with the YFM attribute syntax:

```markdown
{% list tabs group=group_1 %}

- Tab 1 {#my-tab-1}
- Tab 2 {#my-tab-2}

{% endlist %}
```

## Render Variants

| Variant | Description | Use case |
|---------|-------------|----------|
| `regular` | Horizontal tabs (default) | General content switching |
| `radio` | Vertical radio-style tabs | Compact option lists |
| `dropdown` | Dropdown menu selector | Long tab lists |
| `accordion` | Collapsible accordion sections | Progressive disclosure |

## Data Attributes

| Attribute | Description |
|-----------|-------------|
| `data-diplodoc-group` | Group identifier for synchronization |
| `data-diplodoc-key` | Tab key (from tab name or custom `{#key}`) |
| `data-diplodoc-variant` | Render variant (regular, radio, dropdown, accordion) |
| `data-diplodoc-id` | Unique tab identifier |
| `data-diplodoc-is-active` | Marks the active tab on page load |
| `data-diplodoc-forced` | Marks a tab forced open (accordion) |

## CSS Classes

| Class | Element | Description |
|-------|---------|-------------|
| `yfm-tabs` | `<div>` | Tabs container |
| `yfm-tab-list` | `<div>` | Tab header list |
| `yfm-tab` | `<div>` | Individual tab button |
| `yfm-tab-panel` | `<div>` | Tab content panel |
| `active` | Tab/panel | Active state |
| `yfm-tabs-dropdown` | `<div>` | Dropdown variant container |
| `yfm-tabs-dropdown-select` | `<div>` | Dropdown select element |
| `yfm-tabs-accordion` | `<div>` | Accordion variant container |
| `yfm-tabs-vertical` | `<div>` | Radio variant container |
| `yfm-vertical-tab` | `<div>` | Radio variant tab button |

## Transform Options

The `transform()` function accepts the following options:

```typescript
import {transform} from '{{ tabs_info.package }}';

const plugin = transform({
    bundle: true,
    runtimeJsPath: '_assets/tabs-extension.js',
    runtimeCssPath: '_assets/tabs-extension.css',
    containerClasses: 'my-custom-class',
});
```

## Runtime Controller

The `TabsController` class provides interactive behavior:

- Click and keyboard navigation (Arrow keys)
- Active state management across tabs
- Group synchronization between tab groups
- Dropdown menu open/close handling
- Tab state persistence via localStorage and URL query

## React Integration

```typescript
import {TabsRuntime} from '{{ tabs_info.package }}/react';

// Mount once in layout
<TabsRuntime
    saveTabsToLocalStorage={true}
    saveTabsToQueryStateMode='page'
/>
```

The `useDiplodocTabs` hook provides programmatic control:

| Method | Description |
|--------|-------------|
| `selectTab` | Select a tab by group and key |
| `selectTabById` | Select a tab by id |
| `configure` | Configure persistence options |
| `restoreTabs` | Restore tabs from storage/URL |
| `onPageChanged` | Notify page change for URL state |
| `getTabsFromLocalStorage` | Read saved tabs from localStorage |
| `getTabsFromSearchQuery` | Read saved tabs from URL query |

## API Exports

| Export | Type | Description |
|--------|------|-------------|
| `transform` | Function | MarkdownIt plugin factory |
| `./runtime` | Module | Runtime controller (TabsController) |
| `./runtime/styles` | CSS | Runtime stylesheet |
| `./react` | Module | React hook and TabsRuntime component |

## Usage Example

```typescript
import MarkdownIt from 'markdown-it';
import {transform} from '{{ tabs_info.package }}';

const md = new MarkdownIt();

md.use(transform({bundle: false}));

const html = md.render('{% list tabs %}\n- Tab 1\n  Content 1\n{% endlist %}');
```

## Package Information

Package: `{{ tabs_info.package }}`

Version: `{{ tabs_info.version }}`

Variants:

{% for variant in tabs_info.variants %}
- `{{ variant.name }}` — {{ variant.description }}
{% endfor %}

Exports:

{% for exp in tabs_info.exports %}
- `{{ exp }}`
{% endfor %}

{% note info "Tab keys" %}

Tab keys are generated automatically from tab names using the GitHub anchors style. You can override keys with the `{#my-key}` YFM attribute syntax.

{% endnote %}

## Live examples

### Regular tabs

{% list tabs %}

- Linux

  Linux content.

- macOS

  macOS content.

- Windows

  Windows content.

{% endlist %}

### Grouped tabs

{% list tabs group=live_demo %}

- Tab A

  First group, tab A.

- Tab B

  First group, tab B.

{% endlist %}

{% list tabs group=live_demo %}

- Tab A

  Second group, tab A.

- Tab B

  Second group, tab B.

{% endlist %}

### Radio variant

{% list tabs radio %}

- Option 1

  Radio option 1.

- Option 2

  Radio option 2.

{% endlist %}

### Dropdown variant

{% list tabs dropdown %}

- Choice 1

  Dropdown choice 1.

- Choice 2

  Dropdown choice 2.

{% endlist %}

### Accordion variant

{% list tabs accordion %}

- Section 1

  Accordion section 1.

- Section 2

  Accordion section 2.

{% endlist %}

## TOC navigation

This page is registered under Syntax in the sidebar table of contents.
