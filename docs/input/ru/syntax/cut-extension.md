---
title: Cut Extension
description: Testpack fixture exercising the @diplodoc/cut-extension plugin rendering and documentation.
stage: preview
tags:
  - cut
  - collapsible
  - details
  - extension
---

# Cut Extension

The `{{ cut_info.package }}` (v{{ cut_info.version }}) provides collapsible sections (cuts) in YFM documentation. It includes a MarkdownIt transform plugin and a runtime component for interactive behavior.

{{ cut_info.description }}

## Overview

The cut extension enables documentation authors to create collapsible sections that can be expanded or collapsed by users, improving readability and allowing progressive disclosure of information.

Key features:

- Liquid syntax `{% cut "title" %} ... {% endcut %}`
- Directive syntax `:::cut[title] ... :::`
- Grouped cuts with mutually exclusive expansion
- URL hash navigation to specific cuts
- Accessibility features (keyboard navigation, ARIA attributes)
- Runtime highlight effect on focus

## Syntax

### Liquid syntax

The classic Liquid-style cut uses `{% cut %}` and `{% endcut %}` tags:

```markdown
{% cut "Title text" %}

Hidden content goes here.

{% endcut %}
```

### Directive syntax

The directive syntax uses `:::cut` container directive (requires `directiveSyntax: 'enabled'` or `'only'`):

```markdown
:::cut[Title text]

Hidden content goes here.

:::
```

## Attributes

Cuts support attributes via the YFM attribute syntax `{#id .class key=value}`:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `id` | Element identifier for hash navigation | `{#my-cut}` |
| `name` | Groups cuts for mutually exclusive expansion | `{name=group-demo}` |
| `open` | Expands the cut by default | `{open}` |
| `class` | Custom CSS class | `{.custom-cut}` |

## Token Types

The plugin defines the following token types:

| Token | HTML Tag | Description |
|-------|----------|-------------|
| `yfm_cut` | `<details>` | Cut container |
| `yfm_cut_open` | `<details>` | Opening tag |
| `yfm_cut_close` | `</details>` | Closing tag |
| `yfm_cut_title` | `<summary>` | Cut title |
| `yfm_cut_content` | `<div>` | Cut content |

## CSS Classes

| Class | Element | Description |
|-------|---------|-------------|
| `yfm-cut` | `<details>` | Cut container |
| `yfm-cut-title` | `<summary>` | Title element |
| `yfm-cut-content` | `<div>` | Content wrapper |
| `yfm-cut-highlight` | `<details>` | Highlight effect on focus |

## Transform Options

The `transform()` function accepts the following options:

```typescript
import {transform} from '{{ cut_info.package }}';

const plugin = transform({
    bundle: true,
    directiveSyntax: 'disabled',
    runtime: {
        script: './cut-runtime.js',
        style: './cut-runtime.css',
    },
});
```

The `directiveSyntax` option controls syntax modes:

- `disabled` — Only Liquid syntax (default)
- `enabled` — Both Liquid and directive syntax
- `only` — Only directive syntax

## Runtime Controller

The `YfmCutController` class provides interactive behavior:

- Expands parent cuts when a nested cut receives focus
- Highlights the active cut with `yfm-cut-highlight` class
- Removes highlight after 1 second
- Distinguishes mouse clicks from keyboard focus

## API Exports

| Export | Type | Description |
|--------|------|-------------|
| `transform` | Function | MarkdownIt plugin factory |
| `TransformOptions` | Type | Options interface |
| `TokenType` | Const | Token type constants |

## Usage Example

```typescript
import MarkdownIt from 'markdown-it';
import {transform} from '{{ cut_info.package }}';

const md = new MarkdownIt();

md.use(transform(), {output: './docs'});

const html = md.render('{% cut "Click me" %}\nHidden content\n{% endcut %}');
```

## Package Information

Package: `{{ cut_info.package }}`

Version: `{{ cut_info.version }}`

Dependencies:

{% for dep in cut_info.dependencies %}
- `{{ dep }}`
{% endfor %}

Exports:

{% for exp in cut_info.exports %}
- `{{ exp }}`
{% endfor %}

{% note info "Grouped cuts" %}

Cuts with the same `name` attribute form a group. When one cut in a group is expanded, all others in the same group automatically collapse.

{% endnote %}

## Live examples

### Basic cut

{% cut "Expand me" %}{#live-basic}

This content is hidden by default and shown when the cut is expanded.

{% endcut %}

### Cut with code

{% cut "Show code" %}{#live-code}

```javascript
console.log('Hello from cut!');
```

{% endcut %}

### Open by default

{% cut "Already open" %}{#live-open open}

This cut is expanded by default.

{% endcut %}

## TOC navigation

This page is registered under Syntax in the sidebar table of contents.
