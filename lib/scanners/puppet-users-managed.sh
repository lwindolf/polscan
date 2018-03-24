#!/bin/bash

# group: Puppet
# name: Users managed
# description: Checks for Puppet 2/3/4 wether all UID > 1000 are managed using Puppet resources

if puppet_enabled; then
	if puppet_run_ok; then
		users=$(awk -F: '{if(($3 >= 1000) && ($3 < 65534)) { print $1 }}' /etc/passwd)
		unmanaged=
		for u in $users; do
			if ! puppet_resource_exists "User" "$u"; then
				unmanaged="${unmanaged} $u"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged users found:$unmanaged"
		else
			result_ok
		fi
	fi
fi
