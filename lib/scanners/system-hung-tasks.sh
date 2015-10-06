# group: System
# name: No Hung Tasks
# description: There shall be no 'blocked for more than xxx seconds' in dmesg
# solution: Solution often depends on the application blocked, rarely on the HW. Clear dmesg buffer to acknowledge.

logged=$(/bin/dmesg | grep 'blocked for more than [0-9]* seconds')
if [ "$logged" == "" ]; then
	result_ok
else
	result_warning "$logged"
fi
