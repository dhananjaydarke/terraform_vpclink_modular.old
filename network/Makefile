### -------------------------------------------------------------------------------------------------------------------------------
### ---
### This is the local Makefile for Terraform deployment project.
### ---
### Run `make setup` to configure this project and your local dev environment.
### ---
### When configured all make targets will be forwarded to `${GENERAL_RESOURCES}` which is maintained by CCP.
### Check those recipes for more details.
### ---
### Run `make help` to list all recipes.
### ---
### You are free to override any of the targets for a custom pipeline but is absolutely NOT recommended to
### override any targets. CCP intends all teams to use the default targets to close the gaps between pipelines and
### and local deployments with built in best practices.
### ---
### 💡 Recommendation:
### It is recommended to use the latest resources from upstream to get the latest and greatest from CCP.
### Update 'ccp-next-general-resources' py package periodically.
### Run 'poetry update --sync' to update.
### ---
### ⛔ Prerequisites:
### 	'ccp-next-general-resources' py package must in your local (poetry) environment.
### 	Run 'poetry add -G dev ccp-next-general-resources@latest' before continuing.
### 	Check out local environment setup docs for more details:
### ---
### Variables:
### 	- OPTS_POETRY:
### 		- Options to append for `poetry sync`.
### 	- PROJECT_TYPE:
### 		- Determines how `setup-local` configures the project.
### 		- Use this to force when auto-detect fails.
### 		- Defaults to `deployment`.
### 		- For allowed values and to learn more visit:
### -------------------------------------------------------------------------------------------------------------------------------
#

SHELL := /bin/bash

PROJECT_TYPE ?= deployment
GENERAL_RESOURCES ?= .general-resources.mk

.PHONY: help
help: ## show this message. hit `Enter` for line-by-line or `Space` for page-by-page scrolling and `q` to exit the session
	@{ \
		awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\n"} \
			/^###/ {sub(/^### /, ""); description = description $$0 "\n"} \
			/^[a-zA-Z_-]+:.*##/ { \
				printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2 \
			} \
			END { printf "\n%s", description }' $(MAKEFILE_LIST); \
		if [[ -f $(GENERAL_RESOURCES) ]]; then \
			$(MAKE) --no-print-directory -f $(GENERAL_RESOURCES) help; \
		fi \
	} | less -R

setup: FORCE setup-local ## setup development environment
	@$(MAKE) --no-print-directory -f $(GENERAL_RESOURCES) setup;

setup-local: FORCE setup-poetry ## setup local environment by downloading ccp-next-general-resources
	@poetry show ccp-next-general-resources >/dev/null 2>&1 || { \
		printf "\e[31;1m[ERROR] %s\e[0m\n" "'ccp-next-general-resources' py package not installed."; \
		printf "\e[31;1m[ERROR] %s\e[0m\n" "Run 'make help' and check 'Prerequisites' before continuing."; \
		exit 1; \
	}
	@PROJECT_TYPE=$(PROJECT_TYPE) poetry run install-ccp-next-general-resources
	@$(MAKE) --no-print-directory -f $(GENERAL_RESOURCES) setup-local

setup-poetry: ## setup python virtual environment
	@if [ -f $(GENERAL_RESOURCES) ] && grep -q '^setup-poetry:' $(GENERAL_RESOURCES); then \
		$(MAKE) --no-print-directory -f $(GENERAL_RESOURCES) setup-poetry; \
	else \
		if [[ -f poetry.lock ]]; then \
			if [[ -d .venv ]]; then \
				poetry run python -m pip --version >/dev/null 2>&1 || rm -rf ./.venv/* ./.venv/.*; \
				poetry check --lock; \
				poetry sync $(OPTS_POETRY); \
			else \
				poetry check --lock; \
				poetry sync $(OPTS_POETRY); \
			fi; \
		fi; \
	fi

# does not try to forward in pipelines or if the target is in the current Makefile.
# this is **very** delicate and should be modified with caution.
%: FORCE
	@ALL_TARGETS="$(shell awk -F: '/^[a-zA-Z0-9_.-]+:/ {print $$1}' Makefile)"; \
	if [[ "$@" == "Makefile" ]]; then \
		true; \
	elif echo "$$ALL_TARGETS" | grep -qx "$@"; then \
		true; \
	elif [ -f $(GENERAL_RESOURCES) ]; then \
		$(MAKE) --no-print-directory -f $(GENERAL_RESOURCES) $@; \
	else \
		echo "[ERROR] $(GENERAL_RESOURCES) not found; run 'make setup' to create it."; \
		exit 1; \
	fi

# alternative to using .PHONY; useful for dynamically generated targets
FORCE: ;
