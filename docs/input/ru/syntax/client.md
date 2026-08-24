---
title: Client
description: E2E tests for the @diplodoc/client browser SPA — root layout, theme management, header navigation, settings controls, and router behavior.
stage: new
tags:
  - client
  - spa
  - runtime
  - theme
---

This page exercises the `@diplodoc/client` React SPA runtime.

The client package provides the browser-side documentation application: root layout
container, theme management (light/dark), header navigation (logo, links, dropdown),
settings controls (wide format, mini-toc, dark theme, text size), router with
scroll-to-hash, and mobile/desktop responsive detection.

## Root layout

The client renders an `.App` container inside a `g-root` element on the page body.

The body element receives root classes: `g-root`, `g-root_theme_light` (or
`g-root_theme_dark`), `dc-root_wide-format`, `dc-root_document-page`, and
`desktop` (or `mobile` based on viewport width).

## Header navigation

The header is rendered from `toc.yaml` navigation config. It contains a logo
with icon and text, left navigation items (links and dropdowns), and right
items (controls).

### Navigation links

Header left items include relative links, absolute links, and a dropdown menu.

## Settings controls

The settings gear button opens a popover with toggles for wide format, mini-toc,
dark theme, and text size selection.

### Theme switching

Toggling the dark theme switch changes the `g-root_theme_dark` /
`g-root_theme_light` class on the body element.

### Wide format

Toggling the wide format switch adds or removes the `dc-root_wide-format` class
on the body element.

### Mini-toc visibility

Toggling the mini-toc switch shows or hides the in-page mini-toc navigation.

### Text size

Text size buttons (S, M, L) change the `dc-doc-page__body_text-size_*` class.

## Router behavior

The client router supports hash-based navigation with automatic scroll-to-element
when a hash is present in the URL.

## Content sections

### First section

Content for testing hash navigation and scroll behavior.

### Second section

Additional content for scroll position verification.

### Third section

More content to ensure sufficient page height for scroll testing.

## Inline content

The page body renders standard YFM content: **bold text**, *italic text*,
`inline code`, and [links](#root-layout).

- Unordered list item one
- Unordered list item two
- Unordered list item three

1. Ordered list item one
2. Ordered list item two
3. Ordered list item three

| Feature | Component | Class |
|---------|-----------|-------|
| Theme | SettingsControl | `g-root_theme_*` |
| Wide format | SettingsControl | `dc-root_wide-format` |
| Mini-toc | SettingsControl | `dc-mini-toc` |
| Text size | SettingsControl | `dc-doc-page__body_text-size_*` |
