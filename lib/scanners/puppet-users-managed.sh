# group: Puppet
# name: Users managed
# description: Checks for Puppet 2/3 wether all UID > 1000 are managed

if [ -d /var/lib/puppet/state ]; then
	if ! grep -q "^  status: failed" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then 
		users=$(awk -F: '{if(($3 >= 1000) && ($3 < 65534)) { print $1 }}' /etc/passwd)
		unmanaged=
		for u in $users; do
			if ! grep -q "resource: User\[$u\]" /var/lib/puppet/state/last_run_report.yaml 2>/dev/null; then
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
