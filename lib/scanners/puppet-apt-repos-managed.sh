#!/bin/bash

# group: Puppet
# name: APT repos managed
# description: Checks for Puppet 2/3/4 wether all APT repos with the exception of the default debian definition are managed

if puppet_enabled; then
	if puppet_run_ok; then
		repo_files=$(ls /etc/apt/sources.list.d/* 2>/dev/null || grep -v '^default_debian*')
		unmanaged=
		for f in $repo_files; do
			# Note: puppetlabs-apt module has file resources with just the file name...
			# also allow absolute filenames for other e.g. self-written definitions
			if puppet_resource_exists "File" "$f" || puppet_resource_exists "File" "$(basename "$f")"; then
				:
			else
				unmanaged="${unmanaged} $f"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged files found in /etc/apt/sources.list.d/:$unmanaged"
		else
			result_ok
		fi
	fi
fi
