# group: Puppet
# name: /etc/security/limits* managed
# description: Checks for Puppet 2/3/4 wether all /etc/security/limits.d/* definitions are managed using drop files

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then
		files=$(ls /etc/security/limits.d/* 2>/dev/null)
		unmanaged=
		for f in $files; do
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

	tmp=$(egrep -v "^#|^[[:space:]]*$" /etc/security/limits.conf | paste -d'#' -s)
	if [ "$tmp" != "" ]; then
		result_failed "Unexpected entries in /etc/security/limits.conf (all entries should be Puppet managed and in separate files in /etc/security/limits.d/):#$tmp"
	fi
fi
