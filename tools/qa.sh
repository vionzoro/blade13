#!/bin/sh
set -e
python3 build.py
node tools/runner-test.mjs
node tools/pace-test.mjs
node tools/release-guard-test.mjs
node tools/release-guard.mjs
node tools/bot-test.mjs
node tools/cheese.mjs
node tools/spam.mjs
node tools/render-smoke.mjs
node tools/packed-smoke.mjs
echo "== 全绿 =="
