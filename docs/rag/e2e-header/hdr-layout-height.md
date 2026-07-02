---
id: hdr-layout-height
domain: e2e-header
phase: 4b
adr: 003
tags: [header, selenide]
---
# Shell height

**id:** `hdr-layout-height`

## Файлы

`HeaderLayout`

## Входы

any viewport

## Assert

height ≈ 56px

## Do

getBoundingClientRect на [data-testid=header]

## Don't

Screenshot в 4b.1

