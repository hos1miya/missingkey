#!/bin/bash

set -xe

sudo chown node node_modules
git config --global --add safe.directory /workspace
git submodule update --init
pnpm install --frozen-lockfile
cp .devcontainer/devcontainer.yml .config/default.yml
pnpm build
pnpm migrate
