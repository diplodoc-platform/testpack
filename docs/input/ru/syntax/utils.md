# Utils features

This page exercises features powered by the `@diplodoc/utils` package: the `AttrsParser` and `parseMdAttrs` functions used by the YFM table plugin for parsing `{.class #id key=value}` attribute syntax, and the `createIDGenerator` function used for heading anchor IDs.

## Heading attributes {#heading-attrs}

The markdown-it-attrs plugin (enabled by default in the transform) uses `{.class #id key=value}` syntax. The `AttrsParser` from `@diplodoc/utils` is the underlying parser used by the table plugin for the same syntax.

### Heading with class {.custom-heading-class}

This heading has a custom class applied via `{.custom-heading-class}`.

### Heading with data attribute {#data-heading data-role="section"}

This heading has an explicit id and a data attribute.

### Heading with multiple classes {.class-one .class-two}

This heading has two classes applied via `{.class-one .class-two}`.

## Auto-generated heading IDs {#auto-ids}

Headings without explicit `{#id}` syntax receive auto-generated slugified IDs from the `createIDGenerator` function.

## YFM table with attributes {#table-attrs}

The YFM multi-line table plugin uses `parseMdAttrs` and `AttrsParser` to parse attributes on the table closing tag `|#`, row prefixes `||:`, and cell prefixes `::`.

### Table with class and id {#table-class-id}

#|
|| Cell A1
| Cell B1 ||
|| Cell A2
| Cell B2 ||
|# {.utils-table #custom-table-id}

### Table with data attributes {#table-data-attrs}

#|
|| Data cell 1
| Data cell 2 ||
|# {data-utils-table="true" data-cols="2"}

### Table with cell align {#table-cell-align}

#|
||::{align="center"} Centered cell
|::{align="top-right"} Top-right cell ||
||::{align="top-left"} Top-left cell
| Normal cell ||
|#

### Table with cell background {#table-cell-bg}

#|
||::{bg="red"} Red background
|::{bg="blue"} Blue background ||
|| Normal cell
| Another normal cell ||
|#

### Table with header rows {#table-header-rows}

#|
|:{header-rows="1"}
|| Name
| Value ||
|| Alice
| 30 ||
|| Bob
| 25 ||
|#

## Heading anchors {#heading-anchors}

Each heading renders an anchor link (`.yfm-anchor`) that allows deep-linking to the heading. The anchor href uses the heading's id, which is either explicit (`{#id}`) or auto-generated.

## Anchor link verification {#anchor-links}

The `.yfm-anchor` element is an `<a>` tag with `aria-hidden="true"` and an href pointing to the heading id.
