# group: Puppet
# name: SSH Keys managed
# description: Checks for Puppet 2/3 wether all SSH keys are managed

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then 
		authorized_keys_files=$(awk -F : '{ print $6 "/.ssh/authorized_keys" }' /etc/passwd | xargs -n1 ls 2>/dev/null)
		unmanaged=
		for f in $authorized_keys_files; do
			if ! grep -q "resource: File\[$f\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
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
