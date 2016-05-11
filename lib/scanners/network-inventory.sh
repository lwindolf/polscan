# group: Network
# name: Inventory
# description: Inventory only scanner determining external IPv4 IPs, all routes and iptables rule count

ips=$(
	# FIXME: Extremly cheap private net matching...
	/sbin/ip a |\
	/usr/bin/awk '/scope (global|host)/ && !/inet6/ && !/inet (10\.|192\.168\.|172\.|127\.)/ {printf "%s ", $2}'
)

result_inventory "External IPs" "$ips"

result_inventory "Routes" "$(/sbin/ip route | awk '{printf "%s_%s_%s ", $1, $2, $3}')"

result_inventory "iptables Rule Count" "$(
	(
	iptables -L -n --line-numbers | grep '^[0-9]'
	iptables -L -n --line-numbers -t nat | grep '^[0-9]'
	# FIXME: What about other tables?
	) | wc -l
)"
