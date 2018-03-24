#!/bin/bash

# group: System
# name: /var Partition
# description: /var is to be a separate partition
# tags: CCE-26639-5

if mount | grep -q " on /var "; then
	result_ok
else
	result_failed "/var is not a mounted path"
fi
