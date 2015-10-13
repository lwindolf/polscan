# group: Security
# name: Pending Updates
# description: There should be no pending security updates. This check uses debsecan and checks for "high urgency" listings.
# solution-cmd: apt-get install $(debsecan 2>&1 | grep "high urgency" | awk '{print $2}')

pkgs=$(debsecan 2>&1 | grep "high urgency" | awk '{print $2}')
if [ "$pkgs" != "" ]; then
	result_warning "Security upgrades pending:" $pkgs
else
	result_ok
fi
