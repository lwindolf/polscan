# group: Security
# name: No IPv4 forwarding
# description: IPv4 forwarding is to be disabled
# tags: CCE-26866-4

if /sbin/sysctl net.ipv4 | grep -q "\.forwarding = 1" 2>/dev/null; then
	result_failed "IPv4 forwarding is enabled"
fi
