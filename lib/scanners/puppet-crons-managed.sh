# group: Puppet
# name: Cron Jobs managed
# description: Checks for Puppet 2/3/4 wether all cron jobs are managed

if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
else
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
fi

if [ -f $puppet_report ]; then
	if ! grep -q "^  status: failed" $puppet_report 2>/dev/null; then 
		unmanaged=
		for f in /etc/crontab /var/spool/cron/crontabs/*; do
			results=$(
				egrep -v '^[ #]*$|^# [^P]|^#[^ ]|^[^ ]*=|run-parts' "$f" |\
				sed '/^# Puppet Name:/,+1d'
			)
			if [ "$results" != "" ]; then
				unmanaged="${unmanaged}#${f}:${results}"
			fi
		done

		if [ "$unmanaged" != "" ]; then
			result_failed "Unmanaged cron jobs found:$unmanaged"
		else
			result_ok
		fi
	fi
fi
