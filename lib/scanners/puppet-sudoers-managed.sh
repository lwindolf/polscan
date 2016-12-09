# group: Puppet
# name: /etc/sudoers* managed
# description: Checks for Puppet 2/3/4 wether all sudoers definitions are managed

if puppet_enabled; then
	if puppet_run_ok; then
		sudoers_files=$(ls /etc/sudoers.d/* 2>/dev/null)
		unmanaged=
		for f in $sudoers_files; do
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

	tmp=$(egrep -v "^#|^Defaults|^[[:space:]]*$|^(root|admin|%sudo)[[:space:]]" /etc/sudoers | paste -d'#' -s)
	if [ "$tmp" != "" ]; then
		result_failed "Unexpected entries in /etc/sudoers (all entries should be Puppet managed and in separate files in /etc/sudoers.d/):#$tmp"
	fi
fi
