# group: Security
# name: No automounter
# description: The automounter must not be installed
# tags: CCE-26976-1

if dpkg -l 'autofs*' 2>/dev/null | grep -q '^ii'; then
	result_failed "Package autofs is installed"
fi
