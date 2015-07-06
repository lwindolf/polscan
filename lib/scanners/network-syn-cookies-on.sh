# group: Network
# name: SYN Cookie Protection
# description: Ensures that SYN cookies are enabled.

if [[ $(sysctl -n net.ipv4.tcp_syncookies 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.tcp_syncookies is not enabled"
fi
