---
title: Sentenizer
description: Rule-based NLP library for Russian sentence segmentation
stage: new
tags:
  - sentenizer
  - nlp
  - segmentation
  - russian
  - parser
---

# {{ sentenizer_info.package }}

{{ sentenizer_info.description }}

The `sentenize` function splits text into sentences using a set of rules that handle Russian-specific cases like abbreviations, initials, and punctuation. It is used by `@diplodoc/translation` for text segmentation during translation pipelines.

## Overview

Sentenizer is a rule-based sentence segmentation library optimized for **Russian text**. It uses a functional programming approach built on [Ramda](https://ramdajs.com/) and applies hand-crafted rules to determine sentence boundaries.

Key features:

- Rule-based segmentation — no machine learning, fully deterministic
- Russian-specific handling of abbreviations (`и т. д.`), initials (`И. В. Иванов`), quotations, and brackets
- Functional style using Ramda composition, lenses, and predicates
- Window-based context examination around each potential boundary
- Self-contained — no external NLP dependencies, lightweight and fast

{% note info "Primary use case" %}

`@diplodoc/translation` imports `sentenize` to split source text into sentences before translation. Correct sentence boundaries are critical for translation quality.

{% endnote %}

## Package Information

- **Package:** `{{ sentenizer_info.package }}`
- **Version:** `{{ sentenizer_info.version }}`
- **Description:** {{ sentenizer_info.description }}
- **License:** MIT
- **Runtime dependency:** `ramda ^0.28.0`

### Keywords

{% for keyword in sentenizer_info.keywords %}
- {{ keyword }}
{% endfor %}

## API

The library exports a single function:

```typescript
import {sentenize} from '@diplodoc/sentenizer';

const text = 'Он купил фрукты - яблоки, бананы, и т. д. все были очень рады угощению.';
const sentences = sentenize(text);
// ['Он купил фрукты - яблоки, бананы, и т. д. все были очень рады угощению.']
```

The `sentenize` function has the signature `string -> string[]`. It returns an array of segmented sentences.

### Basic usage

```typescript
import {sentenize} from '@diplodoc/sentenizer';

// Multiple sentences separated by . ? ! …
const input =
  'Последовательно обходим кандидатов на разделение, убираем лишние. ' +
  'Используем список эвристик. Сколько гусей было у бабуси? Три Веселых гуся!';
const result = sentenize(input);
// [
//   'Последовательно обходим кандидатов на разделение, убираем лишние. ',
//   'Используем список эвристик. ',
//   'Сколько гусей было у бабуси?',
//   'Три Веселых гуся!'
// ]
```

## Algorithm

The segmentation follows a multi-stage pipeline:

1. **Paragraph splitting** — text is split by double newlines (`\n\n+`) to separate paragraphs
2. **Naive extraction** — each paragraph is split by sentence-end markers (`.`, `!`, `?`, `…`) using a regex
3. **Window-based processing** — a window of characters is examined on each side of a potential boundary
4. **Rule evaluation** — rules determine whether chunks should be joined or split
5. **Result assembly** — processed chunks are collected into the final sentence array

### Rule evaluation order

Rules are evaluated using Ramda's `anyPass`:

- **Break conditions** are checked first — if any matches, chunks are split
- **Join conditions** are checked when no break condition matches — if any matches, chunks are joined
- If neither matches, chunks are split (default behavior)

```typescript
// From src/index.ts
if (!breaks([left, right]) && join([left, right])) {
    left += right; // join the chunks
} else {
    parsed.push(left); // split into separate sentences
    left = right;
}
```

## Rule Conditions

### Break conditions

Break conditions force a sentence split. They are defined in `src/rules/base.ts`.

| Condition | Description |
| --- | --- |
| `leftEndsWithHardbreak` | Left chunk ends with a hard line break |
| `rightStartsWithHardbreak` | Right chunk starts with a hard line break |
| `rightStartsNewlineUppercased` | Right chunk starts on a new line with an uppercase letter |

### Join conditions

Join conditions merge adjacent chunks into a single sentence. They come from `src/rules/base.ts` and `src/rules/abbreviations.ts`.

{% for rule in sentenizer_info.join_rules %}
- **`{{ rule.name }}`** — {{ rule.description }}
{% endfor %}

## Constants

### Markers

Markers are sentence-end and grouping characters defined in `src/constants/markers.ts`.

| Marker set | Characters |
| --- | --- |
| `SENTENCE_END_MARKERS` | `. ? ! …` |
| `QUOTATION_GENERIC_MARKERS` | `" „ ' ` |
| `QUOTATION_CLOSE_MARKERS` | `» ” ’` |
| `BRACKETS_CLOSE_MARKERS` | `) ] } >` |

### Parameters

| Parameter | Value | Description |
| --- | --- | --- |
| `WINDOW_WIDTH` | `10` | Default number of characters examined on each side of a boundary |

{% cut "Abbreviations" %}

The abbreviation constants live in `src/constants/abbreviations.ts`. Each is a `StrBoolMap` where keys are lowercase patterns and values are `true`. Abbreviations prevent false sentence splits at dots inside known abbreviations.

| Category | Description | Examples |
| --- | --- | --- |
| `INITIALS` | Initials patterns | `Дж.`, `Эд.`, `Мд.` |
| `HEAD` | Abbreviation at start of a compound word | `ст.` (ст.-слав.), `лат.`, `англ.`, `проф.` |
| `TAIL` | Abbreviation at end | `тыс.`, `млн.`, `руб.`, `км.` |
| `OTHER` | Standalone abbreviations | `сокр.`, `рис.`, `прим.`, `устар.` |
| `HEAD_PAIR` | Two-word head pairs | `т.е.`, `т.к.`, `и.о.`, `к.н.` |
| `TAIL_PAIR` | Two-word tail pairs | `т.п.`, `т.д.`, `у.е.`, `н.э.` |
| `OTHER_PAIR` | Other two-word pairs | `ед.ч.`, `мн.ч.`, `жен.р.`, `муж.р.` |

To add a new abbreviation, add a lowercase key to the appropriate map with value `true`.

{% endcut %}

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Main entry point, exports `sentenize` |
| `src/parsers/` | Text parsing utilities (sentence extraction, preprocessing) |
| `src/rules/base.ts` | Base rules (space, delimiters, quotations, brackets, hardbreaks) |
| `src/rules/abbreviations.ts` | Abbreviation-related join conditions |
| `src/lenses/` | Ramda lenses for accessing array elements |
| `src/constants/markers.ts` | Sentence-end, quotation, and bracket markers |
| `src/constants/abbreviations.ts` | Russian abbreviation patterns |
| `src/constants/parameters.ts` | Configuration parameters (e.g. `WINDOW_WIDTH`) |
| `src/utilities/` | String and list manipulation utilities |

## Debugging

Rules support debug logging via the `DEBUG` environment variable:

```bash
DEBUG=1 npm test
```

When `DEBUG=1`, each rule evaluation logs the rule name, input arguments (left and right chunks), and the evaluation result. This helps understand why sentences are joined or split.

## Navigation

See the [Tabs](./tabs.md), [Cut](./cut.md), and [Terms](./terms.md) pages for other syntax features.
