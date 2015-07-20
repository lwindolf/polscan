# group: Security
# name: No telnetd
# description: Ensures that telnetd is not installed

if dpkg -l telnetd 2>/dev/null | grep -q '^ii'; then
if [ $? -ne 0 ]; then
	result_failed "telnetd must not be installed!"
else
	result_ok
fi
