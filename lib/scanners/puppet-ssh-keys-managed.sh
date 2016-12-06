# group: Puppet
# name: SSH Keys managed
# description: Checks for Puppet 2/3/4 wether all SSH keys are managed

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then 
		authorized_keys_files=$(awk -F : '{ print $6 "/.ssh/authorized_keys" }' /etc/passwd | xargs -n1 ls 2>/dev/null)
		unmanaged=
		for f in $authorized_keys_files; do
			if ! grep -q "resource: File\[$f\]" $puppet_report 2>/dev/null; then
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
