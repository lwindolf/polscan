# group: Puppet
# name: APT repos managed
# description: Checks for Puppet 2/3/4 wether all APT repos are managed

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then 
		# Note: puppetlabs-apt module has file resources with just the file name...
		repo_files=$(cd /etc/apt/sources.list.d/ && ls || grep -v '^default_debian*')
		unmanaged=
		for f in $repo_files; do
			if ! grep -q "resource: File\[$f\]" $puppet_report 2>/dev/null; then
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
