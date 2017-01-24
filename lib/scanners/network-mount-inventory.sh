# group: Network
# name: Inventory
# description: Inventory only scanner determining distributed filesystem mount points from /proc/mounts

awk '$1 ~ /:/ {print}' /proc/mounts |\
while read remote local type rest; do
	result_network_edge "Mount Point" "$local" "$(hostname -f)" "mount" "$remote" "$type" "out" 1
done


