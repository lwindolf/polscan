# group: Security
# name: No telnetd
# description: Ensures that telnetd is not installed
# solution-cmd: apt-get purge telnetd

if dpkg -l telnetd 2>/dev/null | grep -q '^ii'; then
	result_failed "telnetd must not be installed!"
else
	result_ok
fi
