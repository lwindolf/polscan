# group: Security
# name: No IPv4 forwarding
# description: IPv4 forwarding is to be disabled on all systems, except whitelisted ones
# tags: CCE-26866-4

WHITELIST=	# FIXME: expose as parameter

if ! /bin/echo "$WHITELIST" | grep -q $HOST; then
	if sysctl "net.ipv4" | grep -q "\.forwarding = 1" 2>/dev/null; then
		result_failed "IPv4 forwarding is enabled"
	fi
fi
