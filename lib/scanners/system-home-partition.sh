# group: System
# name: /home Partition
# description: /home is to be a separate partition
# tags: CCE-26639-5

if mount | grep -q " on /home "; then
	result_ok
else
	result_failed "/home is a mounted path"
fi
