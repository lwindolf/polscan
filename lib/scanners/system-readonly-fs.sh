# group: System
# name: Readonly FS
# description: There should be no read-only local filesystems
# source: http://serverfault.com/questions/193971/determine-if-filesystem-or-partition-is-mounted-ro-or-rw-via-bash-script

mounts=$(egrep "^/.*( ro,|,ro )" /proc/mounts | grep -v iso9660 | cut -d " " -f 2)
if [ "$mounts" == "" ]; then
	result_ok
else
	result_warning "Read-only mount points found: $mounts"
fi
