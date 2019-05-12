#!/bin/sh
if ! git pull; then
  exit 1
fi

if ! npm install; then
  exit 1
fi

npm run build