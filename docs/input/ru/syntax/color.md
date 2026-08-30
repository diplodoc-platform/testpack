---
title: Color Extension
description: Inline color plugin for Diplodoc transformer and builder — colored text via curly-brace syntax
stage: preview
tags:
  - color
  - colorify
  - inline
  - styling
  - extension
---

# {{ color_info.package }}

{{ color_info.description }}

The color extension provides inline colored text rendering for YFM documentation. It uses the `{colorName}(text)` syntax to wrap text in a `<span>` element with CSS classes for color-based styling.

## Overview

The `@diplodoc/color-extension` package provides a MarkdownIt inline plugin that transforms `{colorName}(content)` syntax into colored `<span>` elements. It integrates with the Diplodoc transformer pipeline as an inline rule registered before the `emphasis` rule.

Key features:

- Inline color syntax via `{colorName}(text)` curly-brace notation
- Default CSS class `yfm-colorify` with per-color modifier `yfm-colorify--{colorName}`
- Optional `inline` mode that adds inline `style` attribute
- Optional `escape` mode for backslash-escaped parentheses
- Support for nested color blocks
- Support for nested parentheses inside color content
- Markdown formatting preserved inside color blocks

## Package Information

- **Package:** `{{ color_info.package }}`
- **Version:** `{{ color_info.version }}`
- **Description:** {{ color_info.description }}
- **License:** MIT

### Dependencies

{% for dep in color_info.dependencies %}
- {{ dep }}
{% endfor %}

### Exports

{% for export in color_info.exports %}
- `{{ export }}`
{% endfor %}

## Syntax

The color extension uses the `{colorName}(content)` syntax:

- `{` opens the color name
- `colorName` specifies the CSS color class modifier
- `}` closes the color name
- `(` opens the content
- `)` closes the content
- The content is rendered inside a `<span class="yfm-colorify yfm-colorify--{colorName}">` element

## Basic Colors

{#basic-red}

{red}(This text is red)

{#basic-blue}

{blue}(This text is blue)

{#basic-green}

{green}(This text is green)

## Multiple Colors Inline

{#multiple-inline}

{red}(Red) and {blue}(blue) and {green}(green) in one paragraph.

## Nested Colors

{#nested-colors}

{red}(Outer red with {blue}(inner blue) text)

## Nested Parentheses

{#nested-parens}

{green}(Text with (nested) parentheses)

## Inline Formatting

{#inline-formatting}

{red}(Text with **bold** and *italic* formatting)

## Colors in Lists

{#colors-in-lists}

- {red}(First red item)
- {blue}(Second blue item)
- {green}(Third green item)

## Empty Content

{#empty-content}

{red}()

## Colors in Headings

### {red}(Colored Heading Text)

{#colored-heading}

## Configuration Options

The plugin accepts an `Options` object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultClassName` | `string` | `yfm-colorify` | Base CSS class for colored spans |
| `inline` | `boolean` | `false` | Add inline `style` attribute with `color` property |
| `escape` | `boolean` | `false` | Enable backslash escaping for parentheses |

## Token Types

The plugin produces the following markdown-it tokens:

| Token | Type | Tag | Nesting |
|-------|------|-----|---------|
| `color_open` | opening | `span` | `1` |
| `color_close` | closing | `span` | `-1` |

The `info` property on both tokens stores the color name. The `attrs` on the opening token contain the `class` attribute (and `style` when `inline` mode is enabled).

## CSS Classes

The extension generates the following CSS classes:

| Class | Description |
|-------|-------------|
| `yfm-colorify` | Base class applied to all color spans |
| `yfm-colorify--{colorName}` | Color-specific modifier class |

## API Exports

| Export | Description |
|--------|-------------|
| `colorPlugin` | The main MarkdownIt plugin function |
| `default` | Default export (same as `colorPlugin`) |

## Usage Example

```typescript
import MarkdownIt from 'markdown-it';
import colorPlugin from '@diplodoc/color-extension';

const md = new MarkdownIt().use(colorPlugin, {
    defaultClassName: 'yfm-colorify',
    inline: false,
    escape: false,
});

const html = md.renderInline('{red}(hello)');
// Output: <span class="yfm-colorify yfm-colorify--red">hello</span>
```

## Note Directives

{% note info "Inline rule" %}

The color plugin is registered as an inline rule before the `emphasis` rule in the MarkdownIt parser. This means color syntax works in inline contexts like paragraphs, list items, and headings.

{% endnote %}

## TOC Navigation

The Color Extension page is registered in the sidebar under Syntax.
