# group: System
# name: SYN flooding
# description: Ensures that SYN cookies are enabled and SYN backlog is configured on hosts with dmesg reporting SYN flood
# source: https://www.frozentux.net/ipsysctl-tutorial/ipsysctl-tutorial.html#AEN398

logged=$(/bin/dmesg | /bin/grep -i 'possible SYN flooding' | /usr/bin/tail -10)
if [ "$logged" != "" ]; then
	if [[ $(/sbin/sysctl -n net.ipv4.tcp_syncookies 2>/dev/null) == 0 ]]; then
		result_warning "SYN flood warning in dmesg and net.ipv4.tcp_syncookies is not enabled."
	else
		result_warning "$logged"
	fi
	if [[ $(/sbin/sysctl -n net.ipv4.tcp_max_syn_backlog 2>/dev/null) > 1024 ]]; then
		result_critical "SYN flood warning in dmesg and net.ipv4.tcp_max_syn_backlog <= 1024."
	fi
fi
