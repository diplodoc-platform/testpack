# Transform features

This page exercises YFM transformation features provided by the `@diplodoc/transform` package plugins that are not covered by other testpack suites.

## Definition lists {#deflists}

Term one
: Definition for term one.

Term two
: Definition for term two.

Term three
: Definition for term three with **bold** text.

## Superscript {#superscript}

E = mc^2^ is a famous formula. The superscript marker renders text above the baseline.

## Monospace {#monospace}

This sentence contains a ##monospaced## segment rendered as sample output. Another ##monospace example## follows.

## Image sizing {#imsize}

Sized image with width and height:

![Sized logo](../../assets/diplodoc-light.jpg =100x50)

Image with inline width attribute:

![Inline width](../../assets/diplodoc-dark.jpg){width=120}

Image with gallery attribute:

![Gallery image](../../assets/diplodoc-light.jpg){data-gallery=true}

## Video embeds {#video}

YouTube video embed:

@[youtube](dQw4w9WgXcQ)

## Block anchors {#block-anchors}

{%anchor custom-anchor%}

Paragraph after a block anchor. The block anchor creates an in-page navigation target.

## Code with line numbers {#line-numbers}

```js showLineNumbers
const a = 1;
const b = 2;
```

## Code with prompt {#code-prompt}

```bash prompt="$"
$ echo hello
$ ls -la
```

## Code with line wrapping {#code-wrap}

```text wrap
A long line of text that should be wrappable in the rendered output.
```

## Inline code clipboard {#inline-code}

This paragraph has `clipboard inline code` inside it.

## Ordered list with start {#ol-start}

5. Fifth item
6. Sixth item
7. Seventh item

## External links {#external-links}

Link to [external site](https://example.com/) opens in a new tab.

## Headings and anchors {#transform-headings}

### Subsection with explicit id {#explicit-id}

Content under a subsection with an explicit id.
