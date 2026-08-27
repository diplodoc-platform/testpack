---
title: VSC Extension
description: Diplodoc VS Code Extension — schema validation, linting, and visual editors for YFM
stage: preview
tags: [vsc, vscode, extension, validation, linting, editor]
---

# {{ vsc_info.package }}

{{ vsc_info.description }}

The `diplodoc-vsc-extension` (v{{ vsc_info.version }}) provides YAML schema validation, Markdown linting, link navigation, Liquid syntax support, and visual editors for `.md`, `toc.yaml`, and page-constructor `.yaml` files inside VS Code.

## Keybindings {#keybindings}

The extension registers keyboard shortcuts for inserting YFM blocks:

| Shortcut | Command | Output |
| --- | --- | --- |
| `Alt+T` | Insert Table | Markdown table skeleton |
| `Alt+R` | Insert Note | `{% note info %}` block |
| `Alt+C` | Insert Cut | `{% cut %}` collapsible block |
| `Alt+A` | Insert Tabs | `::: tabs` container |
| `Alt+O` | Insert Code Block | Fenced code block |
| `Alt+Z` | Insert Include | `{% include %}` directive |
| `Alt+Q` | Insert Quote | Blockquote |
| `Alt+M` | Insert Mermaid | Mermaid diagram block |
| `Alt+F` | Insert Frontmatter | `---` YAML frontmatter |
| `Alt+P` | Insert Page Constructor | `::: page-constructor` block |
| `Alt+H` | Insert HTML Block | `::: html` block |
| `Alt+V` | Insert Video | `@[youtube]()` embed |
| `Alt+G` | Insert YFM Comment | `{% comment %}` block |

## YAML Language Configuration {#yaml-config}

The extension associates YAML language with Diplodoc config files:

| Filename | Schema | Purpose |
| --- | --- | --- |
| `.yfm` | `yfm` | Project configuration |
| `.yfmlint` | `yfmlint` | Lint rule overrides |
| `toc.yaml` | `toc` | Table of contents |
| `presets.yaml` | `presets` | Liquid preset variables |
| `redirects.yaml` | `redirects` | URL redirects |
| `theme.yaml` | `theme` | Theme configuration |

## Configuration Settings {#settings}

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `diplodoc.editorMode` | string | `wysiwyg` | Default editor mode |
| `diplodoc.isOnlyYfm` | boolean | `false` | Validate only YFM project files |
| `diplodoc.excludedDirs` | array | `[]` | Directories excluded from validation |
| `diplodoc.excludedFiles` | array | regex list | Files excluded from validation |
| `diplodoc.lintRules` | object | `{}` | Custom lint rule overrides |

## Schema Validation {#schema-validation}

The extension validates YAML content against Diplodoc JSON schemas. Frontmatter is validated against the `frontmatter` schema:

```yaml
---
title: My Page
description: A page description
stage: new
tags:
  - documentation
  - example
---
```

Page-constructor blocks embedded in Markdown are validated against the `pc` schema:

```yaml
blocks:
  - type: text
    content:
      text: Hello from page-constructor
```

## Markdown Linting {#markdown-linting}

The extension runs `@diplodoc/yfmlint` with configurable rules. The default config enables all rules and disables a few noisy ones:

```json
{
  "default": true,
  "MD013": false,
  "MD018": false,
  "MD026": false,
  "MD034": false,
  "MD051": false
}
```

A project `.yfmlint` file takes precedence over `diplodoc.lintRules`:

```yaml
default: false
MD013: true
YFM003: error
log-levels:
  MD001: disabled
  MD041: disabled
```

## Link Navigation {#link-navigation}

The extension provides Ctrl+Click navigation for YAML path fields. Supported fields include `href`, `url`, `path`, `src`, `icon`, `from`, `to`, and more. Unreachable local paths produce error diagnostics.

## Liquid Syntax Support {#liquid-support}

The extension provides hover, completion, definition, and highlighting for Liquid syntax. Preset variables resolve from `presets.yaml`:

Variable: {{ vsc_info.package }}
Version: {{ vsc_info.version }}

{% if vsc_info.editor_mode == "wysiwyg" %}
Default editor mode is WYSIWYG.
{% else %}
Default editor mode is markup.
{% endif %}

Available commands:

{% for command in vsc_info.commands %}
- `{{ command }}`
{% endfor %}

## Color Provider {#color-provider}

The extension provides color pickers for YAML and Markdown. In Markdown, colorify syntax `{colorName}(text)` renders colored text:

{red}(This text is red) and {blue}(this text is blue).

## Note Directive {#note-directive}

The `Alt+R` shortcut inserts a note block:

{% note info "Schema Validation" %}

The extension validates frontmatter, page-constructor blocks, and YAML config files against Diplodoc JSON schemas in real time.

{% endnote %}

## Cut Directive {#cut-directive}

The `Alt+C` shortcut inserts a collapsible cut block:

{% cut "YFM Lint Rules" %}

The extension supports all YFM lint rules (YFM001–YFM021). Rules can be configured via `diplodoc.lintRules` setting or `.yfmlint` file.

{% endcut %}

## TOC Navigation {#toc-navigation}

This page is registered under the Syntax section of the table of contents.
