# group: Security
# name: No Avahi
# description: No Avahi services should be running
# tags: CCE-27087-6

if pgrep -f "avahi*"; then
	result_failed "Avahi processes are running!"
fi
