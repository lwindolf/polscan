# group: Security
# name: No at daemon
# description: The atd daemon must not be installed
# tags: CCE-27249-2

dpkg -l at >/dev/null 2>&1
if [ $? -eq 0 ]; then
	result_failed "Package at is installed"
fi
