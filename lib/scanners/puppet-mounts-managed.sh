# group: Puppet
# name: Mounts managed
# description: Checks for Puppet 2/3 wether all mount points are managed as a File resource. This is no perfect check, but gives an indication that they are not rogue mounts.

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then 
		dfs_mounts=$(mount | grep ':/' | sed 's/^.* on \([^ ]*\) type.*/\1/')
		unmanaged=$(
			for f in $dfs_mounts; do
				if ! grep -q "resource: File\[$f\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
				/bin/echo $f
			fi
		done
		)

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged mounts found:" $unmanaged
		else
			result_ok
		fi
	fi
fi
