# group: Puppet
# name: SSH Keys managed
# description: Checks for Puppet 2.7 wether all SSH keys are managed

if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml; then 
	authorized_keys_files=$(cat /etc/passwd | awk -F : '{ print $6 "/.ssh/authorized_keys" }' | xargs -n1 ls 2>/dev/null)
	unmanaged=$(
		for f in $authorized_keys_files; do
			if ! grep -q "resource: File\[$f\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
			echo $f
		fi
	done
	)

	if [ "$unmanaged" != "" ]; then
		result_failed "Unmanaged files found:" $unmanaged
	fi
fi
