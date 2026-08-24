---
title: File Extension
description: Testpack fixture exercising the @diplodoc/file-extension plugin rendering.
stage: preview
tags:
  - file
  - links
  - download
---

# File Extension

This page exercises the `@diplodoc/file-extension` plugin which renders downloadable file links via the `{% file src="..." name="..." %}` syntax.

## Basic file link {#basic-file}

Download the document: {% file src="../assets/diplodoc-light.jpg" name="diplodoc-light.jpg" %}

## File link with language attribute {#lang-file}

Localized asset: {% file src="../assets/diplodoc-dark.jpg" name="diplodoc-dark.jpg" lang="en" %}

## File link with link HTML attributes {#attrs-file}

External asset: {% file src="https://example.com/archive.zip" name="archive.zip" referrerpolicy="origin" rel="help" target="_blank" type="application/zip" %}

## File link with single quotes {#single-quotes}

Single-quoted form: {% file src='index.txt' name='index.html' %}

## File link ignores unknown attributes {#unknown-attrs}

Unknown attrs are dropped: {% file src="../assets/diplodoc-light.jpg" name="report.pdf" foo="1" bar="2" %}

## Multiple file links inline {#multiple-inline}

First {% file src="a.txt" name="a.txt" %} and second {% file src="b.txt" name="b.txt" %} on one line.

## File links in a list {#file-in-list}

- List item one: {% file src="one.txt" name="one.txt" %}
- List item two: {% file src="two.txt" name="two.txt" %}
- List item three: {% file src="three.txt" name="three.txt" %}

## Attribute order independence {#attr-order}

Attributes in any order: {% file type="text/html" name="page.html" src="../index.html" %}

## File icon element {#file-icon}

Every file link renders an icon span before the filename.
