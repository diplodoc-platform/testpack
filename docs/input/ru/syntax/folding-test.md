# Folding Headings Test

This page exercises the `@diplodoc/folding-headings-extension` package, which wraps
headings marked with the `+` suffix (e.g. `#+`, `##+`) into collapsible
`<section class="heading-section">` elements with a content wrapper.

## Basic folding heading

#+ Folding Heading One

Content under the folding heading. This paragraph lives inside the
`<div class="heading-section-content">` wrapper and is hidden until the
section is opened.

## Plain heading between foldings

A plain (non-folding) heading does not open a section.

## Nested folding levels

#+ Top Level Folding

Paragraph under the top level folding heading.

##+ Nested Folding Heading

Paragraph under the nested folding heading. The nested section lives inside
the parent section's content wrapper.

## Folding then plain subheading

#+ Folding With Plain Child

Content under folding heading.

### Plain Child Heading

Content under a plain (non-folding) subheading. Plain headings do not open a
new section.

## Plain then folding

# Plain Top Heading

Plain heading content.

##+ Folding After Plain

Content under the folding heading that follows a plain heading.

## All heading levels fold

#+ H1 Folding

H1 content.

##+ H2 Folding

H2 content.

###+ H3 Folding

H3 content.

####+ H4 Folding

H4 content.

#####+ H5 Folding

H5 content.

######+ H6 Folding

H6 content.

## Folding heading with rich content

#+ Rich Content Folding

- A list item inside a folding section.
- Another list item.

| Column A | Column B |
|----------|----------|
| 1 | 2 |
| 3 | 4 |

```javascript
const x = 42;
console.log(x);
```

> A blockquote inside a folding section.

## Sibling folding sections

#+ First Sibling Folding

First sibling content.

#+ Second Sibling Folding

Second sibling content. The first section must be closed before the second
one opens.

## Non-folding headings render normally

# Regular H1

## Regular H2

### Regular H3

Plain headings render as ordinary `<h1>`/`<h2>`/`<h3>` elements without any
section wrapper.