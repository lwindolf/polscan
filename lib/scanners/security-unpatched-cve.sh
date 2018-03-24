#!/bin/bash

# group: Security-CVEs
# name: Unpatched CVEs
# description: There should be no urgent CVEs unpatched for which there are Debian updates available. Requires debsecan. Also provides a count based inventory.
# solution-cmd: apt-get install $(debsecan --only-fixed 2>&1 | grep "high urgency" | awk '{print $2}')

if [ -f /usr/bin/debsecan ]; then 
	# Note: explicitely pass --config and SOURCE= to workaround Debian #842428
	cves=$(/usr/bin/timeout -k 5 -s 9 4 /usr/bin/debsecan --only-fixed --config <(/bin/echo SOURCE="https://security-tracker.debian.org/tracker/debsecan/release/1/") --suite "$(lsb_release -cs)" 2>/dev/null |\
	grep -v "obsolete" |\
	awk '/high urgency/{print $1 ":" $2}' | sort -u)
	if [ "$cves" != "" ]; then
		result_failed "Unpatched CVE: " $cves
	else
		result_ok
	fi

	count=$(/bin/echo $cves | grep -v '^ *$' | wc -w)
	if [ "$count" -gt 100 ]; then
		count=$(( count / 100 * 100 ))
	elif [ "$count" -gt 10 ]; then
		count=$(( count / 10 * 10 ))
	fi
	result_inventory "Unpatched Count" $count
else
	result_warning "debscan is not installed"
fi
