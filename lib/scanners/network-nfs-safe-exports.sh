#!/bin/bash

# group: Network
# name: Safe NFS Exports
# description: Ensures no NFS export has no_root_squash set
# solution: Remove no_root_squash from /etc/exports and run 'exportfs -a'
# tags: CCE-27138-7 CCE-27121-3 CCE-27167-6

results=

for i in no_root_squash insecure insecure_locks; do
	if /bin/grep -q "$i" /etc/exports >/dev/null 2>&1; then
		results="$results no_root_squash"
	fi
done

if [ "$results" != "" ]; then
	result_failed "Unsafe NFS export options: $results"
else
	result_ok
fi
