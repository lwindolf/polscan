#!/bin/bash

# group: Security
# name: No Core Dumps
# description: Checks if core dumps are disabled in /etc/security/limits.conf and /etc/security/limits.d/*

output=$(grep "core[:space:][:space:]*[^0]" /etc/security/limits.conf /etc/security/limits.d/* 2>/dev/null)
if [ "$output" != "" ]; then
	result_warning "Core dumps are not disabled!"
fi
