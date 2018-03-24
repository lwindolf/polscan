#!/bin/bash

# group: Security
# name: No at daemon
# description: The atd daemon must not be installed
# tags: CCE-27249-2 NIST-800-53-CM-7
# solution-cmd: apt-get purge at

if dpkg -l at 2>/dev/null | grep -q '^ii'; then
	result_failed "Package at is installed"
fi
