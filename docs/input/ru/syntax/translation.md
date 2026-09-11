---
title: Translation
description: Markdown translation utilities for Diplodoc — XLIFF extraction and composition
stage: new
tags:
  - translation
  - xliff
  - localization
  - skeleton
  - markdown
---

# {{ translation_info.package }}

{{ translation_info.description }}

The translation package provides utilities for extracting translatable content from Markdown (and some structured formats) into XLIFF plus a skeleton, and composing translated content back.

## Overview

### Key Features

- Extract translatable text from Markdown into XLIFF 1.2 format
- Generate skeleton files with `%%%N%%%` placeholders for translatable segments
- Compose translated Markdown from skeleton + translated XLIFF
- No-translate directive for marking non-translatable content
- JSON reference resolution (`linkRefs` / `unlinkRefs`)
- Sentence segmentation via `@diplodoc/sentenizer`
- Multiple format support: Markdown (stable), Markdown experimental, JSON
- Validation with AJV (source/target language + locale)
- Code processing modes: `no`, `all`, `precise`, `adaptive`
- Published schemas: JSON Schema, OpenAPI 3.0, OpenAPI 3.1

## Preset Variables

Package: `{{ translation_info.package }}`

Version: `{{ translation_info.version }}`

Description: `{{ translation_info.description }}`

## API

### extract

Extracts skeleton and XLIFF strings from a given Markdown string for use in Computer Assisted Translation tools.

```typescript
import {extract} from '@diplodoc/translation';

const markdown = `# Heading 1

Paragraph with **bold text** and *italic*
`;

const {skeleton, xliff, units} = extract(markdown, {
    source: {language: 'en', locale: 'US'},
    target: {language: 'ru', locale: 'RU'},
    skeletonPath: 'docs/skeleton.skl.md',
    markdownPath: 'docs/page.md',
});
```

The skeleton replaces translatable text with `%%%N%%%` placeholders:

```markdown
%%%0%%%
%%%1%%%**%%%2%%%**%%%3%%%*%%%4%%%*
```

### compose

Composes translated Markdown from a given skeleton and XLIFF string.

```typescript
import {compose} from '@diplodoc/translation';

const translatedMarkdown = compose(skeleton, xliff, {
    useSource: false,
});
```

When `useSource` is `true`, the source text from the XLIFF is used instead of the target translation.

## Extract Output

| Field | Type | Description |
| ----- | ---- | ----------- |
| `skeleton` | `string` | The extracted skeleton string with placeholders |
| `xliff` | `string` | The extracted XLIFF 1.2 string |
| `units` | `string[]` | Array of translatable unit segments |

## Compose Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `useSource` | `boolean` | `false` | Use source text instead of target translation |

## Language Locale

| Field | Type | Description |
| ----- | ---- | ----------- |
| `language` | `string` | Language code (ISO 639-1) |
| `locale` | `string` | Locale code (ISO 3166-1 alpha-2) |

## No-Translate Directive

The `noTranslate` plugin marks content as non-translatable using directive syntax. It supports container, leaf block, and inline directives.

```typescript
import {noTranslate} from '@diplodoc/translation';
import MarkdownIt from 'markdown-it';

const md = MarkdownIt().use(noTranslate({mode: 'translate'}));
```

### Directive Forms

| Form | Syntax | Description |
| ---- | ------ | ----------- |
| Container | `:::no-translate ... :::` | Block-level non-translatable content |
| Leaf block | `::no-translate` | Leaf block non-translatable content |
| Inline | `:no-translate[content]` | Inline non-translatable content |

### Modes

| Mode | Behavior |
| ---- | -------- |
| `translate` | Skips content entirely (removes from translation pipeline) |
| `render` | Renders content as HTML (used for display mode) |

## JSON Reference Resolution

The package provides `linkRefs` and `unlinkRefs` for resolving JSON `$ref` references in structured documents.

```typescript
import {linkRefs, unlinkRefs} from '@diplodoc/translation';

const content = {
    $ref: './other.json#/definitions/Foo',
};

const linked = await linkRefs(content, '/path/to/file.json', loader);
const unlinked = await unlinkRefs(linked);
```

### JSON Functions

| Function | Description |
| -------- | ----------- |
| `linkRefs(content, location, loader)` | Resolves JSON `$ref` references in-place |
| `unlinkRefs(content)` | Replaces resolved refs with original `$ref` definitions |

## Code Processing Modes

| Mode | Description |
| ---- | ----------- |
| `no` | Skip code blocks entirely |
| `all` | Process all code blocks as translatable |
| `precise` | Process code blocks with precise segment identification |
| `adaptive` | Adaptively process code blocks based on content |

## Schemas

The package publishes validation schemas:

| Schema | File | Description |
| ------ | ---- | ----------- |
| JSON Schema | `schemas/json-schema.yaml` | JSON document validation |
| OpenAPI 3.0 | `schemas/openapi-schema-30.yaml` | OpenAPI 3.0 spec validation |
| OpenAPI 3.1 | `schemas/openapi-schema-31.yaml` | OpenAPI 3.1 spec validation |

## Package Information

### Dependencies

{% for dep in translation_info.dependencies %}
- `{{ dep }}`
{% endfor %}

### Exports

{% for export in translation_info.exports %}
- `{{ export }}`
{% endfor %}

## Format Support

| Format | Key | Description |
| ------ | --- | ----------- |
| Markdown (stable) | `md` | Stable Markdown extraction and composition |
| Markdown (experimental) | `mdExp` | Experimental parser with extended features |
| JSON | `json` | JSON document translation with ref support |

The format is auto-detected: string content uses `md` or `mdExp` (when `useExperimentalParser` is `true`), and JSON objects use `json`.

{% note info "Validation" %}

Both `extract` and `compose` validate their options using AJV with custom formats for language codes (ISO 639-1), country codes (ISO 3166-1), absolute paths, and XML content.

{% endnote %}

## Usage Example

### Complete Extract and Compose Workflow

```typescript
import {extract, compose} from '@diplodoc/translation';

const sourceMarkdown = '# Hello World\n\nThis is a paragraph.';

// Step 1: Extract
const {skeleton, xliff} = extract(sourceMarkdown, {
    source: {language: 'en', locale: 'US'},
    target: {language: 'ru', locale: 'RU'},
    skeletonPath: 'output.skl.md',
    markdownPath: 'input.md',
});

// Step 2: Translate the XLIFF using a CAT tool
// (skeleton stays unchanged, xliff is sent to translators)

// Step 3: Compose
const translatedMarkdown = compose(skeleton, translatedXliff, {});
```

{% cut "XLIFF 1.2 Format" %}

The XLIFF output follows the XLIFF 1.2 standard with `trans-unit` elements containing `source` and `target` children.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xliff xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2">
  <file original="input.md" source-language="en-US" target-language="ru-RU" datatype="markdown">
    <header>
      <skeleton>
        <external-file href="output.skl.md"></external-file>
      </skeleton>
    </header>
    <body>
      <trans-unit id="0">
        <source>Hello World</source>
        <target></target>
      </trans-unit>
      <trans-unit id="1">
        <source>This is a paragraph.</source>
        <target></target>
      </trans-unit>
    </body>
  </file>
</xliff>
```

{% endcut %}

## TOC Navigation

This page is registered in the Syntax section of the testpack table of contents.
