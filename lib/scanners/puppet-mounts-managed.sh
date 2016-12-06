# group: Puppet
# name: Mounts managed
# description: Checks for Puppet 2/3/4 wether all mount points are managed as a File resource. This is no perfect check, but gives an indication that they are not rogue mounts.

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then 
		dfs_mounts=$(mount | grep ':/' | sed 's/^.* on \([^ ]*\) type.*/\1/')
		unmanaged=
		for f in $dfs_mounts; do
			if ! grep -q "resource: File\[$f\]" $puppet_report 2>/dev/null; then
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
