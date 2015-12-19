# group: Security
# name: No Avahi
# description: No Avahi services should be running
# tags: CCE-27087-6
# solution-cmd: apt-get purge avahi-daemon

if pgrep -f "avahi*" >/dev/null; then
	result_failed "Avahi processes are running!"
fi
