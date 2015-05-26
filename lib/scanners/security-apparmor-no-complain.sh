#!/bin/bash

# name: Security AppArmor no complain
# description: Checks if there are no AppArmor profiles in complain mode

output=$(aa-status 2>/dev/null)
if [ "$output" != "" ]; then
	if ! echo "$output" | grep -q "0 profiles are in complain mode"; then
		result_warning
	fi
fi
