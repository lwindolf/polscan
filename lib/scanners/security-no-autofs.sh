# group: Security
# name: No automounter
# description: The automounter must not be installed
# tags: CCE-26976-1

dpkg -l 'autofs*' >/dev/null 2>&1
if [ $? -eq 0 ]; then
	result_failed "Package autofs is installed"
fi
