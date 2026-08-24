---
title: Liquid
description: Test page for @diplodoc/liquid package features
stage: preview
tags:
  - templating
  - liquid
  - substitutions
---

# Liquid

## Variable substitution {#variables}

Simple variable: {{ liquid_user.name }}.
Nested object: {{ liquid_user.address.city }}.

## Filters {#filters}

Capitalize filter: {{ liquid_user.name | capitalize }}.
Length filter: {{ liquid_greeting | length }}.

## Conditional branches {#conditions}

{% if liquid_user.role == "admin" %}
Administrator role.
{% elsif liquid_user.role == "editor" %}
Editor role.
{% else %}
Regular role.
{% endif %}

{% if liquid_user.age >= 18 and liquid_user.active %}
Active adult user.
{% endif %}

{% if liquid_tags contains "vip" %}
VIP tag found.
{% else %}
No VIP tag.
{% endif %}

## Range loops {#ranges}

{% for n in liquid_range %}
- Range item {{ n }}
{% endfor %}

## Nested loops {#nested-loops}

{% for group in liquid_groups %}
### {{ group.name }}

{% for member in group.members %}
- {{ member }}
{% endfor %}
{% endfor %}

## not_var escape {#not-var}

Literal: not_var{{ liquid_user.name }} stays unresolved.

## Method calls {#methods}

Slice result: M{{ liquid_word.slice(1) }}.

## Nested conditions {#nested-conditions}

{% if liquid_user %}
{% if liquid_user.role == "editor" %}
Editor confirmed.
{% endif %}
{% endif %}

## Comparison operators {#comparison}

{% if liquid_user.name != "bob" %}
Name is not bob.
{% endif %}

{% if liquid_user.age < 30 %}
Under thirty.
{% endif %}

{% if liquid_user.age <= 25 %}
Twenty five or under.
{% endif %}

{% if liquid_user.age > 20 %}
Over twenty.
{% endif %}

## or operator {#or-operator}

{% if liquid_user.role == "admin" or liquid_user.role == "editor" %}
Privileged user.
{% endif %}
