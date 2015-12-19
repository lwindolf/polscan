# group: Security
# name: Unpatched CVEs
# description: There should be no urgent CVEs unpatched for which there are Debian updates available. Requires debsecan.
# solution-cmd: apt-get install $(debsecan --only-fixed 2>&1 | grep "high urgency" | awk '{print $2}')

if [ -f /usr/bin/debsecan ]; then 
	cves=$(debsecan --only-fixed --suite $(lsb_release -cs) 2>/dev/null | grep 'high urgen' | cut -d " "  -f 1 | sort -u)
	if [ "$cves" != "" ]; then
		result_critical "Unpatched CVE: $cves"
	else
		result_ok
	fi
fi
