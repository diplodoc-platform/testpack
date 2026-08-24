---
title: AJV Schemas
description: Page exercising frontmatter and preset fields defined by @diplodoc/ajv JSON schemas
stage: new
tags:
  - schemas
  - validation
  - metadata
---

# AJV Schemas

This page exercises frontmatter fields and preset variables defined by the `@diplodoc/ajv` package.
The ajv package provides JSON schemas for YFM configuration files: frontmatter, toc.yaml, presets.yaml,
redirects, theme, page-constructor, and more.

## Frontmatter title {#frontmatter-title}

The `title` field in frontmatter defines the page title used in the browser tab,
navigation sidebar, and SEO `title` tag.

## Frontmatter description {#frontmatter-description}

The `description` field in frontmatter produces a `<meta name="description">` tag
for SEO purposes.

## Frontmatter stage {#frontmatter-stage}

The `stage` field controls the document lifecycle. This page uses `stage: new`,
which renders as a `NEW` badge.

## Frontmatter tags {#frontmatter-tags}

The `tags` field defines an array of strings associated with the page.
This page has three tags: schemas, validation, and metadata.

## Preset variables {#preset-variables}

The presets schema defines template variables available in Liquid expressions.

### Nested object variables {#nested-variables}

The presets schema supports nested object values accessible via dot notation.

Package: {{ schema_info.package }}
Version: {{ schema_info.version }}

### Schema list {#schema-list}

The presets schema supports arrays of objects.

{% for item in schema_info.schemas %}
- {{ item }}
{% endfor %}

## Schema coverage {#schema-coverage}

The ajv package exports schemas for:

| Schema             | Purpose                                      |
|--------------------|----------------------------------------------|
| frontmatter        | Page metadata in .md files                   |
| toc                | Table of contents navigation structure       |
| presets            | Template variables for Liquid expressions    |
| redirects          | URL redirect rules                           |
| theme              | Theme configuration                          |
| build-manifest     | Build configuration                          |
| page-constructor   | Page constructor block definitions           |
| yfm                | YFM configuration                            |
| yfmlint            | Linting rules                                |
| leading            | Leading page schema with bundled frontmatter |

## TOC navigation {#toc-navigation}

The AJV Schemas page appears in the sidebar TOC under the Syntax section.
The toc schema defines the structure of `toc.yaml` including sections, pages,
and includes.
