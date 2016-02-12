# group: Network
# name: No DHCP Clients
# description: Production servers should not use DHCP to assign IPs
# solution: Configure a static IP
# tags: CCE-27021-5

if /bin/grep -q '^iface.*dhcp' /etc/network/interfaces /etc/network/interfaces.d/* >/dev/null 2>&1; then
	result_critical "Found DHCP configured interfaces."
else
	result_ok
fi
