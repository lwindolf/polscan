#!/bin/bash

# group: System
# name: 208 day freeze
# description: Ensure we are not running an outdated buggy kernel. Enforce safe uptime <190 days
# solution: Reboot the server before uptime reaches 208 days.
# source: https://www.novell.com/support/kb/doc.php?id=7009834
# source: http://www.claudiokuenzler.com/blog/247/linux-virtual-server-crash-update_cpu_power-kernel-uptime-bug#.VfvWTGWzQy8

kernel_version=$(/bin/uname -r)
if [[ $kernel_version =~ ^2.6.32- ]]; then
	patch_level=$(expr match "$kernel_version" '^2.6.32-\([0-9]\+\)')
	if [[ $patch_level -lt 41 ]]; then
		uptime_days=$(/usr/bin/uptime | sed 's/.* \([0-9][0-9]*\) days.*/\1/')
		if [ "$uptime_days" -lt 208 -a "$uptime_days" -gt 190 ]; then
			result_failed "Uptime is >190. Please reboot!"
		else
			result_warning "Buggy kernel active ($kernel_version). Upgrade to 2.6.32-41 or later!"
		fi
	fi
fi

