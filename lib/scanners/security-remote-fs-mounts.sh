
# group: Security
# name: Remote FS Mounts
# description: All remote FS mounts need to use nodev and nosuid
# tags: CCE-27090-0 CCE-26972-0

# FIXME: Complete list of remote FS
missing_nodev=$(mount | egrep 'nfs|gluster' | grep -v 'nodev')
missing_nosuid=$(mount | egrep 'nfs|gluster' | grep -v 'nosuid')

if [ "$missing_nodev" != "" ]; then
	result_failed "Remote FS mount without nodev option: $missing_nodev"
fi
if [ "$missing_nosuid" != "" ]; then
	result_failed "Remote FS mount without nosuid option: $missing_nosuid"
fi
