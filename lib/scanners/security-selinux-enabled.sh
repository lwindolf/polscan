# group: Security
# name: SELinux enabled
# description: Uses 'sestatus' to check if SELinux is enabled.

if ! sestatus 2>/dev/null | grep -q enabled; then
	result_failed "sestatus does not report 'enabled'"
fi
