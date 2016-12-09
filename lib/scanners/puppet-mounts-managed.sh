# group: Puppet
# name: Mounts managed
# description: Checks for Puppet 2/3/4 wether all mount points are managed as a File resource. This is no perfect check, but gives an indication that they are not rogue mounts.

if puppet_enabled; then
	if puppet_run_ok; then
		dfs_mounts=$(mount | grep ':/' | sed 's/^.* on \([^ ]*\) type.*/\1/')
		unmanaged=
		for f in $dfs_mounts; do
			if ! puppet_resource_exists "File" "$f"; then
				unmanaged="${unmanaged}#$f"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged mounts found:$unmanaged"
		else
			result_ok
		fi
	fi
fi
