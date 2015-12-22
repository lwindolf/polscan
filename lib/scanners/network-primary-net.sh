# group: Network
# name: Primary Net
# description: Inventory only scanner determining the network the FQDN resolves to

ip=$(/usr/bin/getent hosts $(/bin/hostname -f))
ip=${ip/ */}

if [ "$ip" != "" ]; then
	net=$(/bin/ip route | grep $ip)
	result_inventory "Primary Net" ${net/ */}
fi
