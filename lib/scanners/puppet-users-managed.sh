# group: Puppet
# name: Users managed
# description: Checks for Puppet 2/3/4 wether all UID > 1000 are managed

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then 
		users=$(awk -F: '{if(($3 >= 1000) && ($3 < 65534)) { print $1 }}' /etc/passwd)
		unmanaged=
		for u in $users; do
			if ! grep -q "resource: User\[$u\]" $puppet_report 2>/dev/null; then
				unmanaged="${unmanaged} $u"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged users found:$unmanaged"
		else
			result_ok
		fi
	fi
fi
