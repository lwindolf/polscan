# group: Packages
# name: No dpkg errors
# description: Checks no installed package has error flag

audit_output=$(/usr/bin/dpkg -C 2>/dev/null)
halfconf_output=$(/usr/bin/dpkg -l 2>/dev/null | awk '/^iF/ {print $2}')
error=0

if [ "$halfconf_output" != "" ]; then
	error=1
	result_failed "dpkg half configured: $halfconf_output"
fi

if [ "$audit_output" != "" ]; then
	error=1
	result_failed "dpkg audit reports: $audit_output"
fi

if [ $error -ne 0 ]; then
	result_ok
fi
