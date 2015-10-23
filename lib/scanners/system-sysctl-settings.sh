# group: System
# name: sysctl Settings
# description: sysctl settings should be applied and persistent. That means all settings in /etc/sysctl.conf /etc/sysctl.d/*.conf must be active. This is important because network settings are not safely applied in Debian Squeeze by the procps script (running to early in the boot order).
# solution-cmd: /sbin/sysctl -p
# source: http://serverfault.com/a/494899
# source: https://bugs.launchpad.net/ubuntu/+source/procps/+bug/50093
# source: http://wiki.debian.org/BridgeNetworkConnections

modified=$(/bin/egrep -vh "^ *#|^ *$" /etc/sysctl.conf /etc/sysctl.d/*.conf 2>/dev/null | sed "s/ *= */ = /" 2>/dev/null)
all=$(/sbin/sysctl -a 2>/dev/null)
results=

for m in "$modified"; do
	if ! echo "$all" | grep -q "$m"; then
		results="$results $m"
	fi
done

if [ "$results" == "" ]; then
	result_ok
else
	result_failed "The following sysctl settings are not active: $m"
fi
