
# group: System
# name: Persistent Mounts
# description: All mount points need to be persistent.

fstab=$(grep -v '^#' /etc/fstab | awk '{print $2}')
mountpoints=$(mount | egrep -v '(proc|type rpc|type tmpfs|fuse|on /dev|on /sys|on /run|on /cgroup)' | awk '{if($2 == "on") {print $3}}')
non_persistent=

for m in $mountpoints
do
	if [[ $fstab =~ ^$m$ ]]; then
		non_persistent="$non_persistent $m"
	fi
done

if [ "$non_persistent" == "" ]; then
	result_ok
else
	result_failed "Non-persistent mount points found: $non_persistent"
fi
