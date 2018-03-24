#!/bin/bash

# group: System
# name: OOM logged
# description: There shall be no 'Out of memory: kill process' in /var/log/dmesg as they usually indicate insufficient memory or memory leaks.

logged=$(/bin/dmesg | grep 'Out of memory: kill process' | tail -10)
if [ "$logged" == "" ]; then
	result_ok
else
	result_failed "dmesg has 'Out of memory: kill process' entries: $logged"
fi
