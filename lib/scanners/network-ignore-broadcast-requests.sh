# group: Network
# name: Ignore Broadcasts
# description: Ensures that ICMP broadcast requests are ignored
# source: http://people.redhat.com/swells/scap-security-guide/RHEL/7/output/table-rhel7-cces.html
# solution-cmd: echo 'net.ipv4.icmp_echo_ignore_broadcasts=1' >/etc/sysctl.d/50-icmp_echo_ignore_broadcasts.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.icmp_echo_ignore_broadcasts 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.icmp_echo_ignore_broadcasts is not 1"
fi
