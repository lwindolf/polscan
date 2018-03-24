#!/bin/bash

# group: Security
# name: No portmapper
# description: Ensures that portmap is not installed
# solution-cmd: apt-get purge portmap

if dpkg -l portmap 2>/dev/null | grep -q '^ii'; then
	result_failed "portmap must not be installed!"
else
	result_ok
fi
