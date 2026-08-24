# CLI Features

## Variable substitution {#variables}

Project name: {{ project_name }}.
Environment: {{ env }}.
Version: {{ version }}.

## Conditional content {#conditions}

{% if env == "test" %}

Running in **test** environment.

{% endif %}

{% if env == "production" %}

This should not appear.

{% endif %}

## For loops {#loops}

{% for item in items %}

- {{ item.name }}: {{ item.value }}

{% endfor %}

## Includes {#includes}

{% include [Included Fragment](./cli-include-fragment.md) %}

## Include with anchor {#include-anchor}

{% include [Section](./cli-include-fragment.md#section) %}
