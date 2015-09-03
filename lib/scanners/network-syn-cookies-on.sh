# group: Network
# name: SYN Cookie Protection
# description: Ensures that SYN cookies are enabled.
# tags: CCE-27053-8
# solution-cmd: echo 'net.ipv4.tcp_syncookies=1' >/etc/sysctl.d/50-net.ipv4.tcp_syncookies.conf

if [[ $(/sbin/sysctl -n net.ipv4.tcp_syncookies 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.tcp_syncookies is not enabled"
fi
