# group: Network
# name: Inventory
# description: Inventory only scanner determining distributed filesystem mount points from /proc/mounts and mount clients on NFS exports using showmount

awk '$1 ~ /:/ {print}' /proc/mounts |\
while read remote local type rest; do
	result_network_edge "Mount Point" "$local" "$(hostname -f)" "mount" "$remote" "$type" "out" 1
done

while read ip share; do
	result_network_edge "Mount Point" "nfs" "$(hostname -f)" "high" "$ip" "NFS Share $share" "in" 1
done < <(test -f /sbin/showmount && /sbin/showmount --no-headers 2>/dev/null | sed "s/\:/ /")
