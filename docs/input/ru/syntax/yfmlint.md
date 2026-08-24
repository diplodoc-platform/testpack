---
title: YFM Lint
description: Test page for @diplodoc/yfmlint package features
stage: new
tags:
  - linting
  - validation
  - syntax
---

# YFM Lint

This page exercises YFM syntax features validated by the `@diplodoc/yfmlint` package. All content on this page passes yfmlint validation rules (YFM001-YFM021).

## Terms {#terms}

YFM uses [terms](*lint-term-1) for reusable definitions. A [term](*lint-term-2) links to its definition by ID. The linter checks that definitions are unique (YFM006), used terms have definitions (YFM007), terms are not nested inside definitions (YFM008), and definitions appear at the end of the file (YFM009).

## Inline code {#inline-code}

Short inline code like `npm install` and `yfmlint --check` passes YFM001 because the content is under the maximum length of 100 characters.

## Autotitle links {#autotitle-links}

Links to headers on the same page use autotitle syntax. The [Terms](#terms) section above is referenced via an anchor link. YFM002 validates that link targets have headers, and YFM010 validates that autotitle anchors are reachable.

## Note directive {#note-directive}

{% note info %}

This note block uses valid YFM directive syntax validated by YFM020. The note types info, tip, warning, and alert are supported.

{% endnote %}

## Anchor directive {#anchor-directive}

{%anchor lint-anchor%}

The anchor directive creates a hidden in-page navigation target. YFM020 validates that the directive name is known and the syntax is correct.

## Conditional directives {#conditional-directives}

{% if env == "test" %}

This content renders when the environment is test. The if/endif directives are validated by YFM020.

{% endif %}

## For loop directives {#for-loop-directives}

The for/endfor directives iterate over preset arrays. YFM020 validates their syntax.

{% for item in items %}

- {{ item.name }}: {{ item.value }}

{% endfor %}

## Non-BMP compliance {#non-bmp-compliance}

This section uses only characters from the Unicode Basic Multilingual Plane (code points U+0000 to U+FFFF). YFM021 flags characters outside the BMP (encoded as UTF-16 surrogate pairs) that may break layout in some browsers.

## Rule coverage {#rule-coverage}

The table below lists all YFM lint rules implemented by the `@diplodoc/yfmlint` package.

| Rule | Alias | Description |
|------|-------|-------------|
| YFM001 | inline-code-length | Inline code line length |
| YFM002 | no-header-found-for-link | No header found for link |
| YFM003 | unreachable-link | Unreachable link |
| YFM004 | table-not-closed | Table not closed |
| YFM005 | tab-list-not-closed | Tab list not closed |
| YFM006 | term-definition-duplicated | Term definition duplicated |
| YFM007 | term-used-without-definition | Term used without definition |
| YFM008 | term-inside-definition-not-allowed | Term inside definition not allowed |
| YFM009 | no-term-definition-in-content | Term definition not at end of file |
| YFM010 | unreachable-autotitle-anchor | Autotitle anchor unreachable |
| YFM011 | max-svg-size | Max SVG size |
| YFM018 | term-definition-from-include | Term definition from include |
| YFM020 | invalid-yfm-directive | Unknown or invalid YFM directive |
| YFM021 | no-non-bmp-characters | Non-BMP character may break layout |

[*lint-term-1]: Reusable definition linked by ID within YFM documentation, placed at end of file per YFM009.
[*lint-term-2]: Another term definition placed at the end of the file to comply with YFM009 placement rule.
