# group: Network
# name: Ignore ICMP
# description: Ensures that ICMP requests are ignored
# solution-cmd: echo 'net.ipv4.icmp_echo_ignore_all=1' >/etc/sysctl.d/50-net.ipv4.icmp_echo_ignore_all.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.icmp_echo_ignore_all 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.icmp_echo_ignore_all is not 1"
fi
