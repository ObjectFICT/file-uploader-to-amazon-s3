#!/bin/sh
docker build -t file-picker .
docker run -p 80:3000 file-picker
