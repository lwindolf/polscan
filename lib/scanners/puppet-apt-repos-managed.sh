# group: Puppet
# name: APT repos managed
# description: Checks for Puppet 2/3 wether all APT repos are managed

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then 
		# Note: puppetlabs-apt module has file resources with just the file name...
		repo_files=$(cd /etc/apt/sources.list.d/ && ls || grep -v '^default_debian*')
		unmanaged=
		for f in $repo_files; do
			if ! grep -q "resource: File\[$f\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
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
