#!/bin/sh
docker build -t file-picker .
docker run -p 80:80 file-picker
