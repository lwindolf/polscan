# group: Puppet
# name: SSH Keys managed
# description: Checks for Puppet 2/3/4 wether all SSH keys are managed

if puppet_enabled; then
	if puppet_run_ok; then 
		authorized_keys_files=$(awk -F : '{ print $6 "/.ssh/authorized_keys" }' /etc/passwd | xargs -n1 ls 2>/dev/null)
		unmanaged=
		for f in $authorized_keys_files; do
			if ! puppet_resource_exists "File" "$f"; then
				unmanaged="${unmanaged} $f"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged files found:$unmanaged"
		else
			result_ok
		fi
	fi
fi
