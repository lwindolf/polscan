# group: Security
# name: Pending Updates
# description: There should be no pending security updates. This check uses debsecan and checks for "high urgency" listings. Note: debsecan does not report package versions.
# solution-cmd: apt-get install $(debsecan --only-fixed 2>&1 | grep "high urgency" | awk '{print $2}')

pkgs=$(/usr/bin/timeout -k 5 -s 9 4 /usr/bin/debsecan --only-fixed --suite $(lsb_release -cs) 2>&1 | grep "high urgency" | awk '{print $2}')
if [ "$pkgs" != "" ]; then
	result_warning "Security upgrades pending:" $pkgs
else
	result_ok
fi
