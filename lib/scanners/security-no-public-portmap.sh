# group: Security
# name: No public portmap
# description: The portmap port must no be visible on external IPs.

if netstat -tlpn | grep -q "0.0.0.0:111.*LISTEN.*portmap"; then
	ext_ips=$(ip a | grep "inet " | egrep -v "inet (172|10|192|127)")
	if [ "$ext_ips" != "" ]; then
		result_failed "Portmap port bound on 0.0.0.0"
	fi
fi
