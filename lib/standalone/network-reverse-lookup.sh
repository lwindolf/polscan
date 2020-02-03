#!/bin/bash

# group: Network
# name: Host Reverse Lookup
# description: Ensures that all hosts have reverse lookup properly configured

for h in $HOST_LIST; do
	h=${h/*@/}
	ip=$(dig +short $h)
	if [ "$ip" != "" ]; then
		reverse=$(dig +short -x $ip)
		if ! echo "${reverse}" | grep -q "^${h}\."; then
			echo "$h Network FAILED |||Host Reverse Lookup||| Reverse lookup failed. Unexpected result '$reverse'."
		else
			echo "$h Network OK |||Host Reverse Lookup||| Reverse lookup is ok"
		fi
	fi
done
