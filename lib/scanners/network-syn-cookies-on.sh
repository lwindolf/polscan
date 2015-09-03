# group: Network
# name: SYN Cookie Protection
# description: Ensures that SYN cookies are enabled.
# source: http://people.redhat.com/swells/scap-security-guide/RHEL/7/output/table-rhel7-cces.html
# solution-cmd: echo 'net.ipv4.tcp_syncookies=1' >/etc/sysctl.d/50-net.ipv4.tcp_syncookies.conf

if [[ $(/sbin/sysctl -n net.ipv4.tcp_syncookies 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.tcp_syncookies is not enabled"
fi
