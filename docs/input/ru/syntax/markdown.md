# Markdown rendering

## Notes {#notes}

{% note info %}

Information note content with **bold** text.

{% endnote %}

{% note warning %}

Warning note content with *italic* text.

{% endnote %}

{% note tip "Custom Tip Title" %}

Tip note content with `inline code`.

{% endnote %}

{% note alert %}

Alert note content.

{% endnote %}

## Code blocks {#code-blocks}

```javascript
const greeting = 'hello';
console.log(greeting);
```

```
Plain code block without language.
```

## Tables {#tables}

| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| cell 1   | cell 2   | cell 3   |
| cell 4   | cell 5   | cell 6   |

## Task lists {#task-lists}

- [x] Completed task
- [ ] Pending task
- [ ] Another pending task

## Headings and anchors {#headings-anchors}

### Subsection with anchor {#subsection-anchor}

Content under a subsection.

## Links {#links}

Internal [link to notes](#notes) and external [link to Diplodoc](https://diplodoc.com/).

## Blockquotes {#blockquotes}

> This is a blockquote with some content.
>
> Second paragraph of the blockquote.

## Inline formatting {#inline-formatting}

**Bold text**, *italic text*, ~~strikethrough text~~, and `inline code`.
