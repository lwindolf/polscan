# group: Security
# name: No IPv6 forwarding
# description: IPv6 forwarding is to be disabled

if /sbin/sysctl net.ipv6 | grep -q "\.forwarding = 1" 2>/dev/null; then
	result_failed "IPv6 forwarding is enabled"
fi
