#!/bin/bash

# group: Systemd
# name: No failed services
# description: Ensure there are no failed services or units in maintenance

output=$(systemctl list-units 2>/dev/null)
if [ "$output" != "" ]; then
	failed=$(/bin/echo "$output" | egrep " loaded (maintenance|failed) " | cut -d " " -f2)
	if [ "$failed" != "" ]; then
		result_warning "There are failed services: " $failed
	else
		result_ok
	fi
fi
