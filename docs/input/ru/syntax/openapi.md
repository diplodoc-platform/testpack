---
title: OpenAPI Sandbox
description: Testpack fixture exercising the @diplodoc/openapi-extension transform plugin.
stage: preview
tags:
  - openapi
  - api
  - sandbox
  - interactive
---

# OpenAPI Sandbox

This page exercises the `@diplodoc/openapi-extension` transform plugin which converts `openapi-sandbox` fenced code blocks into interactive API testing sandbox placeholders.

## Basic GET sandbox {#basic-get}

```openapi-sandbox
method: get
path: /users
server: https://api.example.com
```

## POST sandbox with body {#post-body}

```openapi-sandbox
method: post
path: /users/create
server: https://api.example.com
```

## PUT sandbox {#put-method}

```openapi-sandbox
method: put
path: /users/update
server: https://api.example.com
```

## DELETE sandbox {#delete-method}

```openapi-sandbox
method: delete
path: /users/delete
server: https://api.example.com
```

## PATCH sandbox {#patch-method}

```openapi-sandbox
method: patch
path: /users/patch
server: https://api.example.com
```

## Sandbox with localhost server {#localhost-server}

```openapi-sandbox
method: get
path: /health
server: http://localhost:8080
```

## Sandbox with complex path {#complex-path}

```openapi-sandbox
method: get
path: /api/v1/users/123/posts
server: https://api.example.com
```

## Multiple sandbox blocks {#multiple-blocks}

```openapi-sandbox
method: get
path: /products
server: https://api.example.com
```

```openapi-sandbox
method: post
path: /orders
server: https://api.example.com
```

## Sandbox with description {#with-description}

```openapi-sandbox
method: get
path: /status
server: https://api.example.com
description: Health check endpoint
```
