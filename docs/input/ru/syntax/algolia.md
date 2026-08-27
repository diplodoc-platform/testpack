---
title: Algolia
description: Documentation for @diplodoc/algolia-extension — Algolia search integration for Diplodoc
stage: preview
tags: [algolia, search, indexing, provider, algolia-extension]
---

# {{ algolia_info.package }}

{{ algolia_info.description }}

The `@diplodoc/algolia-extension` package (v{{ algolia_info.version }}) provides Algolia search integration for Diplodoc documentation. It indexes built docs into Algolia and provides a seamless search experience via a client-side Web Worker.

## Overview {#overview}

The extension integrates with the Diplodoc CLI build pipeline as a search provider. During the build, it processes HTML documents into section-based search records, generates local JSON indices in the `_search/` directory, and optionally uploads them to Algolia.

### Key Features {#key-features}

- Automatic indexing of documentation content
- Multi-language support
- Customizable search settings
- Parallel processing via worker pool
- Section-based search results for precise navigation
- Client-side search implementation via Web Worker

## Configuration {#configuration}

### Required Configuration {#required-config}

| Parameter | Environment Variable | CLI Option | Description |
| --- | --- | --- | --- |
| App ID | `ALGOLIA_APP_ID` | `--app-id` | Your Algolia application ID |
| API Key | `ALGOLIA_API_KEY` | `--api-key` | Algolia admin API key (for indexing) |
| Index Name | `ALGOLIA_INDEX_NAME` | `--index-name` | Name of the Algolia index |

### Optional Configuration {#optional-config}

| Parameter | CLI Option | Default | Description |
| --- | --- | --- | --- |
| Input Path | `--input` | `./` | Path to documentation directory |
| Index | `--index` | `false` | Whether to create and upload an index |
| Search API Key | `--search-api-key` | - | Client-side API key for search |
| Provider | `--search-provider` | `algolia` | Search provider name |
| API Path | `--search-api` | `_search/api.js` | Path to client-side search API |

## Usage {#usage}

### Basic Usage {#basic-usage}

Install the extension and use it with the Diplodoc CLI:

```bash
npx -y @diplodoc/cli -i ./input-docs -o ~/output-docs --extensions @diplodoc/algolia-extension
```

### Using Environment Variables {#env-usage}

```bash
export ALGOLIA_APP_ID="your-app-id"
export ALGOLIA_API_KEY="your-api-key"
export ALGOLIA_INDEX_NAME="your-index-name"

npx -y @diplodoc/cli -i ./input-docs -o ~/output-docs --extensions @diplodoc/algolia-extension
```

### Using CLI Flags {#cli-usage}

```bash
npx -y @diplodoc/cli -i ./input-docs -o ~/output-docs \
  --extensions @diplodoc/algolia-extension \
  --app-id "your-app-id" \
  --api-key "your-api-key" \
  --index-name "your-index-name" \
  --index
```

### Configuration File {#config-file}

```yaml
search:
  provider: algolia
  appId: your-app-id
  indexName: docs
  index: true
  indexSettings:
    searchableAttributes:
      - title
      - content
      - headings
      - keywords
  querySettings:
    hitsPerPage: 10
```

## Index Command {#index-command}

The extension provides a dedicated `index` command for indexing documentation without rebuilding it:

```bash
npx -y @diplodoc/cli index -i ~/output-docs \
  --extensions @diplodoc/algolia-extension \
  --app-id "your-app-id" \
  --api-key "your-api-key" \
  --index-name "your-index-name"
```

## Document Processing {#document-processing}

The `processDocument` function splits HTML into sections by headings and creates `AlgoliaRecord` objects:

```typescript
interface AlgoliaRecord {
  objectID: string;
  title: string;
  content: string;
  headings: string[];
  keywords: string[];
  tags?: string[];
  anchor?: string;
  url: string;
  lang: string;
  section?: string;
  level?: number;
}
```

### Record Size Limits {#record-limits}

- Maximum record size: 9600 bytes
- Large records are split into chunks of 4000 characters
- Each chunk gets a unique `objectID` suffix (`-chunk-1`, `-chunk-2`, etc.)

## Search Provider {#search-provider}

The `AlgoliaProvider` class implements the `SearchProvider` interface:

| Method | Description |
| --- | --- |
| `add(path, lang, info)` | Add a document to the index |
| `release()` | Finalize and write local indices |
| `addObjects()` | Upload indices to Algolia |
| `clearIndex()` | Clear all records from Algolia |
| `setSettings(settings)` | Configure Algolia index settings |
| `config(lang, includeTags)` | Generate client-side search config |

## Client-Side Search {#client-search}

The extension generates a Web Worker (`_search/api.js`) that handles client-side search queries to Algolia:

```javascript
workerScope.api = {
  async init() { /* initialize config */ },
  async suggest(query, count) { /* autocomplete */ },
  async search(query, count, page, tags) { /* full search */ },
};
```

The worker sends POST requests to `https://{appId}.algolia.net/1/indexes/{indexName}/query` with highlight and snippet parameters.

## Package Information {#package-info}

Package name: {{ algolia_info.package }}
Version: {{ algolia_info.version }}

Available configuration options:

{% for option in algolia_info.options %}
- `{{ option.flag }}` — {{ option.description }}
{% endfor %}

Dependencies:

{% for dep in algolia_info.dependencies %}
- `{{ dep }}`
{% endfor %}

{% note info "Local Indexing" %}

By default, the extension only creates local search indices in the `_search` directory. To upload indices to Algolia, set the `index` parameter to `true` or run the dedicated `index` command.

{% endnote %}

{% cut "Index Naming Convention" %}

The Algolia index name follows the pattern `{indexName}-{lang}`. For example, if `indexName` is `docs` and the language is `ru`, the full index name becomes `docs-ru`.

{% endcut %}

## TOC Navigation {#toc-navigation}

This page is registered under the Syntax section of the table of contents.
