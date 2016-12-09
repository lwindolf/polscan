# group: Puppet
# name: Cron Jobs managed
# description: Checks for Puppet 2/3/4 wether all cron jobs are managed using the Puppet cron resource

if puppet_enabled; then
	if puppet_run_ok; then
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
