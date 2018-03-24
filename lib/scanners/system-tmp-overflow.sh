#!/bin/bash

# group: System
# name: Overflow tmp
# description: There should be no overflow mounted /tmp. This happens when you have no /tmp partition and / runs full. In this case the kernel mounts an 1MB /tmp partition which is unusable in normal operation.
# solution-cmd: umount overflow
# source: http://jarrodoverson.com/blog/overflow-filesystem-in-linux/
# source: http://stackoverflow.com/questions/17536139/tmp-mounted-with-only-1mb-space-100-used-as-filesystem-overflow

if grep -q "^overflow.*/tmp" /proc/mounts; then
	result_failed "/tmp is overflow mounted!"
fi
