# group: Network
# name: NFS4 Idmapd
# description: On all NFS4 clients idmapd should be running

if /bin/mount | grep -q "type nfs4"; then
	if [ "$(pgrep -f idmapd)" == "" ]; then
		result_failed "idmapd is not running!"
	else
		result_ok "idmapd is running"
	fi
fi

