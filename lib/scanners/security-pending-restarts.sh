#!/bin/bash

# group: Security
# name: Pending Restarts
# description: There should be no pending service restarts after library upgrades. This is checked using the needstart tool which needs to be installed (Available starting with Jessie/Wheezy Backports).

services=$(/usr/sbin/needrestart -b -r l 2>/dev/null)
if [ "$services" != "" ]; then
	result_warning "Services requiring restart: $services"
else
	result_ok
fi
