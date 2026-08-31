---
title: Quote Link Extension
description: Testpack fixture exercising the @diplodoc/quote-link-extension plugin rendering.
stage: preview
tags:
  - quote-link
  - blockquote
  - link
  - extension
---

# Quote Link Extension

This page exercises the `@diplodoc/quote-link-extension` package (v{{ quote_link_info.version }}) which turns blockquotes into quote link blocks when the first paragraph starts with a link carrying the `data-quotelink` attribute.

## Overview

The quote link extension adds **quote link** blocks: Markdown blockquotes whose first paragraph starts with a link marked with `data-quotelink` (or `{data-quotelink}` in YFM attribute syntax). The plugin changes token types and adds a CSS class so the block can be styled and wired to the runtime.

### Key Features

- Detects blockquotes starting with a `data-quotelink` link
- Splits the link and trailing content into separate paragraphs
- Supports both `data-quotelink` and `{data-quotelink}` YFM attribute syntax
- Handles nested quote links and nested plain blockquotes
- Adds `yfm-quote-link` CSS class to the blockquote element

## Basic quote link {#basic-quote-link}

> [Quote link](https://ya.ru){data-quotelink}
>
> quote link text

## Quote link with data-quotelink="true" {#quoted-true}

> [Quote link](https://ya.ru){data-quotelink="true"}
>
> quote link text

## Quote link with multiple paragraphs {#multiple-paragraphs}

> [Quote link](https://ya.ru){data-quotelink}
>
> quote link paragraph 1
>
> quote link paragraph 2

## Quote link same line {#same-line}

> [Quote link](https://ya.ru){data-quotelink}
> quote link text on same line

## Nested quote links {#nested-quote-links}

> [Quote link](https://ya.ru){data-quotelink="true"}
>
> quote link text
>
> > [Nested](https://nested.ru){data-quotelink="true"}
> >
> > nested link text

## Simple quote inside quote link {#simple-inside}

> [Quote link](https://ya.ru){data-quotelink="true"}
>
> quote link text
>
> > Simple quote
> >
> > simple quote text

## Quote link inside simple quote {#link-inside-simple}

> Simple quote
>
> simple quote text
>
> > [Nested quote link](https://nested.ru){data-quotelink="true"}
> >
> > nested quote link text

## Simple quote without link {#plain-quote}

> This is a plain blockquote without a quote link.

## Simple quote with link but no data-quotelink {#link-no-attr}

> [Simple link](https://ya.ru)
>
> link text without quote link attribute

## Package Information

Package: {{ quote_link_info.package }}

Description: {{ quote_link_info.description }}

### Dependencies

{% for dep in quote_link_info.dependencies %}
- {{ dep }}
{% endfor %}

### Exports

{% for exp in quote_link_info.exports %}
- {{ exp }}
{% endfor %}

## Syntax Reference

| Syntax | Description |
|---|---|
| `{data-quotelink}` | YFM attribute marking a link as quote link trigger |
| `{data-quotelink="true"}` | Explicit boolean form of the attribute |
| `> [text](url){data-quotelink}` | Quote link block with link only |
| `> [text](url){data-quotelink}\n> text` | Quote link with content on next line |
| `> [text](url){data-quotelink} text` | Quote link with content on same line (auto-split) |

## CSS Classes

| Class | Target |
|---|---|
| `yfm-quote-link` | The blockquote element turned into a quote link block |

## Token Types

| Token Type | Description |
|---|---|
| `yfm_quote-link_open` | Opening token for quote link block |
| `yfm_quote-link` | Core token type for quote link block |
| `yfm_quote-link_close` | Closing token for quote link block |

## Runtime Assets

| Asset | Default Path |
|---|---|
| Script | `_assets/quote-link-extension.js` |
| Style | `_assets/quote-link-extension.css` |

## Transform Options

| Option | Type | Default | Description |
|---|---|---|---|
| `runtime` | `string \| {script, style}` | `_assets/quote-link-extension.*` | Runtime script and style paths |
| `bundle` | `boolean` | `true` | Copy built runtime files to output |

## Usage Example

```typescript
import MarkdownIt from 'markdown-it';
import {transform} from '@diplodoc/quote-link-extension';

const md = new MarkdownIt().use(transform({bundle: false}));
const html = md.render('> [Quote](https://example.com){data-quotelink}\n>\n> text');
```
