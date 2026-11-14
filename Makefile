# yj-forum-nsh — NSH 客户端校验入口（CI 与本地共用）
SHELL := /bin/bash
NSH ?= nsh

.PHONY: nsh-check nsh-test nsh-run-web

nsh-check: ## 类型检查（TypeScript 7）
	@$(NSH) check .

nsh-test: ## 无头测试（*.test.tsx）
	@$(NSH) test .

nsh-run-web: ## 浏览器预览（默认 http://127.0.0.1:8790/）
	@$(NSH) run . --target web
