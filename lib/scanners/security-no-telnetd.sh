# group: Security
# name: No telnetd
# description: Ensures that telnetd is not installed
# tags: CCE-27073-6 CCE-26836-7 NIST-800-53-AC-17(8) NIST-800-53-CM-7
# solution-cmd: apt-get purge telnetd

if dpkg -l telnetd 2>/dev/null | grep -q '^ii'; then
	result_failed "telnetd must not be installed!"
else
	result_ok
fi
