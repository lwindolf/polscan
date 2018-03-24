#!/bin/bash

# group: Network
# name: Internet Reachable
# description: Ensures that outbound internet traffic is possible. Useful when you use external APT repos other other internet services.

if /bin/ping -W 1 -c 1 8.8.8.8 >/dev/null 2>&1; then
	result_ok
else
	result_failed "Ping 8.8.8.8 failed"
fi
