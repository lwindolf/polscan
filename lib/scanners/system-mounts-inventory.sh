# group: Network
# name: Mount Inventory
# description: Inventory of all DFS mounts

# Generic dump for all types of mounts...
/bin/mount | /usr/bin/awk '$1 ~ /:/ {
	sub(/:/, " ", $1)
	print $3, fqdn, $5, $1
}' fqdn=$(hostname -f) |\
while read details; do
	result_network_edge "Mounts" $details
done
