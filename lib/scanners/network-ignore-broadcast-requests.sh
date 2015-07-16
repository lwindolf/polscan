# group: Network
# name: Ignore Broadcasts
# description: Ensures that ICMP broadcast requests are ignored
# tags: CCE-26883-9

if [[ $(sysctl -n net.ipv4.icmp_echo_ignore_broadcasts 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.icmp_echo_ignore_broadcasts is not 1"
fi
