---
title: Search Extension
description: Documentation for @diplodoc/search-extension — Lunr-based offline search for Diplodoc
stage: preview
tags: [search, lunr, offline, indexing, worker, search-extension]
---

# {{ search_info.package }}

{{ search_info.description }}

The `@diplodoc/search-extension` package (v{{ search_info.version }}) provides Lunr-based offline search for the Diplodoc platform. It indexes documentation content at build time and serves a client-side Web Worker that executes search queries against the prebuilt index.

## Overview {#overview}

The extension has two layers: a build-time **indexer** (`src/indexer/`) that extracts searchable text from rendered HTML and builds a Lunr index plus a document registry, and a client-side **worker** (`src/worker/`) that loads the index in the browser and answers `suggest` / `search` queries with pagination, tag filtering, and snippet highlighting.

### Key Features {#key-features}

- Build-time indexing via Lunr
- Client-side Web Worker for offline search
- Configurable tolerance for fuzzy matching
- Phrased and sparsed confidence scoring modes
- Field boosting for title, keywords, and content
- Multi-language support with stemmers and stop words
- HTML content extraction with `data-no-index` support
- Tag-based result filtering
- Result highlighting with configurable mark class

## Configuration {#configuration}

### Worker Configuration {#worker-config}

The `WorkerConfig` type extends `ISearchWorkerConfig` from `@diplodoc/client`:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `tolerance` | `number` | `2` | Fuzzy match level: 0 precise, 1 trailing wildcard, 2 leading + trailing |
| `confidence` | `Confidence` | `phrased` | Scoring strategy: `phrased` or `sparsed` |
| `resources.index` | `string` | - | URL of the Lunr index bundle |
| `resources.registry` | `string` | - | URL of the document registry bundle |
| `resources.language` | `string` | - | Optional per-language stemmer bundle |

## Indexing {#indexing}

### Indexer API {#indexer-api}

The `Indexer` class builds the Lunr index and document registry at build time:

```typescript
import {Indexer, ReleaseFormat} from '@diplodoc/search-extension';

const indexer = new Indexer();

indexer.add('ru', '/docs/intro', {
  title: 'Introduction',
  html: '<h1>Introduction</h1><p>Welcome to Diplodoc</p>',
  meta: {keywords: ['intro'], tags: ['getting-started']},
});

const {index, registry} = indexer.release('ru', ReleaseFormat.JSONP);
```

### Release Formats {#release-formats}

| Format | Value | Output |
| --- | --- | --- |
| JSONP | `ReleaseFormat.JSONP` | `self.index=...` / `self.registry=...` wrappers for Web Worker `importScripts` |
| RAW | `ReleaseFormat.RAW` | Plain Lunr index and registry objects |

## Worker API {#worker-api}

The client-side worker implements `ISearchWorkerApi` with `init`, `suggest`, and `search`:

```javascript
workerScope.api = {
  async init() { /* load index, registry, and language bundles */ },
  async suggest(query, count) { /* autocomplete with short snippets */ },
  async search(query, count, page, tags) { /* full search with pagination */ },
};
```

The worker memoizes the last query and result, caps raw matches at `MAX_COUNT_RESULT` (100), and paginates results via `paginateResult`.

### Tolerance Levels {#tolerance-levels}

| Level | Pattern | Description |
| --- | --- | --- |
| 0 | `word` | Precise match only |
| 1 | `word*` | Trailing wildcard on every clause |
| 2 | `*word*` | Leading and trailing wildcards on every clause |

{% for level in search_info.tolerance_levels %}
- Level {{ level.level }} — `{{ level.pattern }}`: {{ level.description }}
{% endfor %}

### Confidence Modes {#confidence-modes}

| Mode | Description |
| --- | --- |
| `phrased` | Phrase-aware scoring rewarding consecutive tokens within `MERGE_TOLERANCE` distance |
| `sparsed` | Plain Lunr scoring without phrase awareness |

{% for mode in search_info.confidence_modes %}
- `{{ mode.mode }}`: {{ mode.description }}
{% endfor %}

## Field Boosting {#field-boosting}

The `INDEX_FIELDS` constant defines boost weights applied during Lunr index construction:

| Field | Boost |
| --- | --- |
| `title` | 10 |
| `keywords` | 8 |
| `content` | 1 |

{% for field in search_info.field_boosts %}
- `{{ field.field }}` — boost {{ field.boost }}
{% endfor %}

## HTML Extraction {#html-extraction}

The `html2text` function parses rendered HTML with `node-html-parser`, splits content at block-level tags, preserves `<pre>` content as raw text, skips elements marked with `data-no-index`, and collapses whitespace:

```typescript
import {html2text} from '@diplodoc/search-extension';

const text = html2text('<h1>Title</h1><p>Body text</p>');
// 'Title\nBody text'
```

## Tag Filtering {#tag-filtering}

Documents may carry `tags` for filtering. Tags prefixed with `_` are treated as technical and excluded from the public tag list and from filtering. The `filterResultsByTags` helper keeps results whose document has any of the selected tags; when no tags are selected, all results are returned.

## Result Formatting {#result-formatting}

### Highlighting {#highlighting}

The `format` helper maps search results to `SearchSuggestPageItem` objects and highlights matched terms using a configurable `mark` CSS class. Snippet trimming uses `short` for autocomplete suggestions and `long` for full search results.

### Pagination {#pagination}

The `paginateResult(result, count, page)` helper slices results into pages. The `MAX_LENGTH` constant (200) caps each description snippet length.

## Multi-Language Support {#multi-language}

The extension ships 30 language stemmer modules via `lunr-languages`. The indexer enables `lunr.multiLanguage('en', lang)` when a stemmer exists for the target language.

## Package Information {#package-info}

Package name: {{ search_info.package }}
Version: {{ search_info.version }}

Dependencies:

{% for dep in search_info.dependencies %}
- `{{ dep }}`
{% endfor %}

Entry points:

{% for entry in search_info.exports %}
- `{{ entry }}`
{% endfor %}

{% note info "Offline Search" %}

The extension runs entirely client-side after the build-time index is generated. No server-side query endpoint is required — the Web Worker loads the prebuilt Lunr index and registry via `importScripts`.

{% endnote %}

{% cut "Index Loading" %}

The worker lazily loads the index, registry, and optional language bundles via `importScripts`, then constructs the Lunr index with `Index.load`. The `AssertConfig` guard throws `NOT_INITIALIZED` if `init` was not called before `suggest` or `search`.

{% endcut %}

## TOC Navigation {#toc-navigation}

This page is registered under the Syntax section of the table of contents.
