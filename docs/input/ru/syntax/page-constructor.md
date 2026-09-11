---
title: Page Constructor
description: Testpack fixture exercising the @diplodoc/page-constructor-extension transform plugin.
stage: preview
tags:
  - page-constructor
  - blocks
  - layout
  - interactive
---

# Page Constructor

This page exercises the `@diplodoc/page-constructor-extension` transform plugin which converts `::: page-constructor` container directives into rendered page-constructor blocks.

## Basic content layout {#basic-content}

::: page-constructor
blocks:
  - type: text
    text: Hello from page constructor
:::

## Card layout {#card-layout}

::: page-constructor
blocks:
  - type: card-layout
    title: Card Layout Title
    description: Card Layout Description
    blocks:
      - type: text
        text: Card content text
:::

## Header slider block {#header-slider}

::: page-constructor
blocks:
  - type: header-slider
    title: Header Slider Title
    description: Header Slider Description
:::

## Multiple blocks {#multiple-blocks}

::: page-constructor
blocks:
  - type: text
    text: First block
  - type: text
    text: Second block
:::

## Block with conditions {#with-conditions}

::: page-constructor
blocks:
  - type: text
    text: Conditional content
    when: env == "test"
:::

## Empty blocks {#empty-blocks}

::: page-constructor
blocks: []
:::

## Block with icon {#with-icon}

::: page-constructor
blocks:
  - type: icon
    icon: check
    text: Icon block text
:::
