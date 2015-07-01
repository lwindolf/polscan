# group: Security
# name: No IPv6 forwarding
# description: IPv6 forwarding is to be disabled on all systems, except whitelisted ones

WHITELIST=	# FIXME: expose as parameter

if ! echo "$WHITELIST" | grep -q $HOST; then
	if sysctl "net.ipv6" | grep -q "\.forwarding = 1" 2>/dev/null; then
		result_failed "IPv6 forwarding is enabled"
	fi
fi
