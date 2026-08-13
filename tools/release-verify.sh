#!/bin/sh
set -eu

sh tools/qa.sh
node tools/terrain.mjs
node tools/pose.mjs
node tools/port.mjs
node tools/perf.mjs
node tools/seed-sweep.mjs
node tools/repro-build.mjs

echo "== 发布验证全绿 =="
