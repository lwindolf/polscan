# group: Puppet
# name: APT repos managed
# description: Checks for Puppet 2.7 wether all APT repos are managed

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then 
		repo_files=$(ls /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null)
		unmanaged=$(
			for f in $repo_files; do
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
fi
