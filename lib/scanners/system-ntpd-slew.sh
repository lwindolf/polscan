
# group: System
# name: NTPd with -x
# description: Checks ntpd is running with -x option. This is useful to survive leap second effects.

if pgrep -f "ntpd.*-x" >/dev/null; then 
	result_ok
else
	result_failed "ntpd not running with -x option"
fi
