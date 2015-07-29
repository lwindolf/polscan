# group: Network
# name: Ignore ICMP
# description: Ensures that ICMP requests are ignored

if [[ $(/sbin/sysctl -n net.ipv4.icmp_echo_ignore_all 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.icmp_echo_ignore_all is not 1"
fi
