# group: System
# name: No MCE logged
# description: There shall be no 'Machine check events' in /var/log/dmesg as they can indicate real hardware issues
# solution: There is no real solution. But 'apt-get install mcelog && mcelog' can help to diagnose it. Clear dmesg buffer to acknowledge.
# source: http://serverfault.com/questions/430005/machine-check-events-logged

logged=$(/bin/dmesg | grep 'Machine check events logged' | tail -10)
if [ "$logged" == "" ]; then
	result_ok
else
	result_failed "dmesg has 'Machine check events logged' entries"
fi
