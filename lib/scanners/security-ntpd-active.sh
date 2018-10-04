# group: Security
# name: ntpd on
# description: There must be a running NTP server (as ntpd or chronyd)
# tags: CCE-27093-4
# solution-cmd: apt-get install ntp; /etc/init.d/ntp start

if ! pgrep -f "(ntpd|chronyd)" >/dev/null; then
	result_failed "No running NTP process found!"
else
	result_ok
fi
