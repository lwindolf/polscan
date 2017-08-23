# group: Network
# name: Stale Mounts
# description: NFS clients should have no stale mounts

stale_mounts=$(
	mount -t nfs |\
	awk '{print $3}' |\
	xargs -r -n 1 stat 2>&1 |\
	grep Stale
)

if [ "$stale_mounts" != "" ]; then
	result_failed "$stale_mounts"
else
	result_ok "No stale mounts found."
fi

