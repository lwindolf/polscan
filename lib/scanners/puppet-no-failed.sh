# group: Puppet
# name: No failed
# description: Checks for Puppet 2/3 last_run_report.yaml for failed resources

puppet_report=/var/lib/puppet/state/last_run_report.yaml
if [ -f $puppet_report ]; then 
	failed=$(nl $puppet_report 2>/dev/null | grep 'status: failure')
	resources=
	while read f; do
		# Ugly YAML parsing by backtracking resource...
		resources="$resources,$(nl $puppet_report | grep -B100 "$f" | grep 'resource:' | sed 's/.*resource://;s/"//g' | tail -1)"
	done < <(echo "$failed")

	if [ "$resources" != "" ]; then
		result_failed "Failed resources:" ${resources/,/}
	else
		result_ok
	fi
fi
