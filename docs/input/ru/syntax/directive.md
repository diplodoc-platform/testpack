---
title: Directive
description: Documentation for @diplodoc/directive — pluggable parser for directive syntax in markdown
stage: new
tags:
  - directive
  - parser
  - syntax
  - markdown-it
---

# {{ directive_info.package }}

{{ directive_info.description }}

## Overview

The `@diplodoc/directive` package is a pluggable parser for directive syntax in markdown markup. It integrates with MarkdownIt via the `markdown-it-directive` plugin and provides a registration API for adding custom block and inline directives.

## Directive Syntax

Supported inline and block directive syntax. Inline directives start with `:`. Block directives may be leaf blocks (without content, starting with `::`) and container blocks (with content, starting with `:::`).

- Inline: `:name [content] (identifier) {key=value}`
- Leaf block: `::name [inline content] (identifier) {key=value}`
- Container block:

```text
:::name [inline content] (identifier) {key=value}
content
:::
```

All parameter groups — `[]`, `()`, `{}` — are optional, but their order is fixed.

- `[]` — used for inline content;
- `()` — used for a required identifier (id, url, etc.);
- `{}` — used to pass optional named arguments / attributes / `key=value` pairs.

## Package Information

- Package: `{{ directive_info.package }}`
- Version: `{{ directive_info.version }}`

{% for item in directive_info.syntax_forms %}
- **{{ item.name }}** ({{ item.marker }}): {{ item.description }}
{% endfor %}

## API Exports

### Parser Plugin

- `directiveParser()` — MarkdownIt plugin wrapper around `markdown-it-directive`.

```typescript
import {directiveParser} from '@diplodoc/directive';

md.use(directiveParser());
```

### Enable / Disable Helpers

- `enableInlineDirectives(md)` — enable parsing of inline directives.
- `disableInlineDirectives(md)` — disable parsing of inline directives.
- `enableBlockDirectives(md)` — enable parsing of leaf and container block directives.
- `disableBlockDirectives(md)` — disable parsing of leaf and container block directives.

### Registration Helpers

- `registerInlineDirective(md, name, handler)` — register handler for a new inline directive.
- `registerLeafBlockDirective(md, config)` — register handler for a new leaf block directive.
- `registerContainerDirective(md, config)` — register handler for a new container block directive.

```typescript
import {directiveParser, registerContainerDirective} from '@diplodoc/directive';

md.use(directiveParser());

registerContainerDirective(md, {
    name: 'block',
    match(_params, state) {
        return true;
    },
    container: {
        tag: 'div',
        token: 'simple_block',
        attrs: {
            class: 'simple-block',
        },
    },
});
```

### Tokenizers

- `tokenizeInlineContent(state, content)` — parse and tokenize content of `[]`-section.
- `tokenizeBlockContent(state, content, parentType)` — parse and tokenize content between opening `:::name` and closing `:::`.
- `createBlockInlineToken(state, params)` — create token with inline content of `[]`-section.

## Directive-Powered Extensions

The directive package is the foundation for several Diplodoc extensions that register custom directive handlers:

| Extension | Directive Name | Type | Default |
|-----------|---------------|------|---------|
| cut-extension | `cut` | container | disabled |
| file-extension | `file` | inline | disabled |
| html-extension | `html` | container (code_block) | enabled |
| page-constructor | `page-constructor` | container | enabled |

## Parameter Groups

The three parameter groups have a fixed order: `[]`, then `()`, then `{}`.

| Group | Syntax | Purpose | Required |
|-------|--------|---------|----------|
| Square brackets | `[content]` | Inline content (e.g. title) | No |
| Parentheses | `(identifier)` | Identifier (id, url) | No |
| Curly braces | `{key=value}` | Named attributes | No |

## Quickstart Example

```typescript
import type MarkdownIt from 'markdown-it';
import {directiveParser, registerContainerDirective} from '@diplodoc/directive';

export function simpleBlockPlugin(): MarkdownIt.PluginSimple {
    return (md) => {
        md.use(directiveParser());

        registerContainerDirective(md, 'block', (state, params) => {
            if (!params.content) return false;

            let token = state.push('simple_block_open', 'div', 1);
            token.attrSet('class', 'simple-block');

            tokenizeBlockContent(state, params.content);

            token = state.push('simple_block_close', 'div', -1);

            return true;
        });
    };
}
```

The resulting markup from `::: block` with content produces:

```html
<div class="simple-block">
  <h3>Heading 3 inside a simple block</h3>
</div>
```

{% note info "Directive vs Liquid" %}

Directive syntax (`:::name`) and Liquid syntax (`{% block %}`) are two different extension mechanisms. Some extensions like `cut` support both forms — the Liquid form (`{% cut %}`) is enabled by default, while the directive form (`::: cut`) must be explicitly enabled via the `directiveSyntax` option.

{% endnote %}

## TOC Navigation

This page is registered in the sidebar under Syntax → Directive.
