# group: Security
# name: No portmapper
# description: Ensures that portmap is not installed

if dpkg -l portmap 2>/dev/null | grep -q '^ii'; then
if [ $? -ne 0 ]; then
	result_failed "portmap must not be installed!"
else
	result_ok
fi
