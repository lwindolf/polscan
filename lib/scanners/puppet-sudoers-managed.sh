# group: Puppet
# name: /etc/sudoers* managed
# description: Checks for Puppet 2/3 wether all sudoers definitions are managed

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
		sudoers_files=$(ls /etc/sudoers.d/* 2>/dev/null)
		unmanaged=$(
		for f in $sudoers_files; do
			if ! grep -q "resource: File\[$f\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
				/bin/echo $f
			fi
		done
		)
	
		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged files found:" $unmanaged
		else
			result_ok
		fi
	fi

	tmp=$(egrep -v "^#|^Defaults|^[[:space:]]*$|^(root|admin|%sudo)[[:space:]]" /etc/sudoers)
	if [ "$tmp" != "" ]; then
		result_failed "Unexpected entries in /etc/sudoers (all entries should be Puppet managed and in separate files in /etc/sudoers.d/): $tmp"
	fi
fi
