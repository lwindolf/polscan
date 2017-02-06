# group: Security
# name: Pending Updates
# description: There should be no pending security updates. This check uses debsecan and checks for "high urgency" listings. Note: debsecan does not report package versions.
# solution-cmd: apt-get install $(debsecan --only-fixed 2>&1 | grep "high urgency" | awk '{print $2}')

# Note: explicitely pass --config and SOURCE= to workaround Debian #842428
if [ -f /usr/bin/debsecan]; then
	/usr/bin/timeout -k 5 -s 9 4 /usr/bin/debsecan --only-fixed --config <(/bin/echo SOURCE="https://security-tracker.debian.org/tracker/debsecan/release/1/") --suite $(lsb_release -cs) 2>&1 | grep "high urgency" |\
	while read cve package tags; do
		tags=$(/bin/echo "$tags" | sed "s/fixed, //;s/(//;s/)//")
		result_vulnerability "$cve" "$package" "$tags"
	done
else
	result_warning "debscan is not installed"
fi

