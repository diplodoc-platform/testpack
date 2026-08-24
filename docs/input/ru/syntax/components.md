---
title: Components
stage: preview
tags:
  - rendering
  - layout
  - ui
---

# Components

This page exercises the `@diplodoc/components` React rendering layer.
The components package provides the documentation UI: page layout, sidebar TOC,
in-page mini-toc, page title, content body, and feedback widgets.

## Page layout {#page-layout}

The page is rendered using the `DocPage` component from `@diplodoc/components`.
It provides a three-column layout: sidebar (TOC) on the left, content in the center,
and an aside on the right.

### Layout structure {#layout-structure}

The layout uses CSS classes prefixed with `dc-` (Diplodoc Components):
- `dc-doc-layout` — the root layout container
- `dc-doc-page` — the center content column
- `dc-doc-layout__toc` — the left sidebar containing the TOC
- `dc-doc-page__content` — the main content area (renders as `<main>`)

## Headings and mini-toc {#headings-mini-toc}

When a page has multiple headings, an in-content mini-toc is rendered
to help users navigate within the page.

### Subsection alpha {#subsection-alpha}

Content under the first subsection.

### Subsection beta {#subsection-beta}

Content under the second subsection.

### Subsection gamma {#subsection-gamma}

Content under the third subsection.

## Content rendering {#content-rendering}

The `DocPage` component renders the transformed HTML inside `dc-doc-page__body`.
This body has the `yfm` CSS class for YFM-specific styling.

### Paragraphs and inline formatting {#inline-formatting}

**Bold text**, *italic text*, ~~strikethrough~~, and `inline code` are rendered
inside the body container.

### Lists {#lists}

Unordered list:
- First item
- Second item
- Third item

Ordered list:
1. Step one
2. Step two
3. Step three

### Code blocks {#code-blocks}

```typescript
interface DocPageProps {
  title: string;
  html: string;
  headings: Heading[];
}
```

### Tables {#tables}

| Component    | Block class       | Purpose                    |
|--------------|-------------------|----------------------------|
| DocPage      | `dc-doc-page`     | Main page layout           |
| Toc          | `dc-toc`          | Sidebar table of contents  |
| MiniToc      | `dc-mini-toc`     | In-page navigation         |
| Breadcrumbs  | `dc-breadcrumbs`  | Navigation breadcrumbs     |
| Feedback     | `dc-feedback`     | User feedback widget       |

## Feedback widget {#feedback-widget}

The `Feedback` component is rendered at the bottom of the page content
when the `feedback` interface is enabled. It provides like, dislike,
and comment controls.

## Sidebar navigation {#sidebar-navigation}

The sidebar TOC (`dc-toc`) is rendered by the `Toc` component.
It displays the navigation tree from `toc.yaml` and highlights
the current page.
