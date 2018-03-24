#!/bin/bash

# group: System
# name: /tmp Partition
# description: /tmp is to be a separate partition
# tags: CCE-26435-8

if mount | grep -q " on /tmp "; then
	result_ok
else
	result_failed "/tmp is not a mounted path"
fi
