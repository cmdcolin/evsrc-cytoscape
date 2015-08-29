#!/bin/bash
set e
set u

rm -rf dist
mkdir -p dist/js
mkdir -p dist/img
browserify js/index.js | uglifyjs > dist/js/index.js
cp index.html dist/index.html
cp js/springy.js dist/js/springy.js
cp js/seedrandom.js dist/js/seedrandom.js
cp index.html dist