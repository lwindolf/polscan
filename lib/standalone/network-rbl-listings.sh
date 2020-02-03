#!/bin/bash

# group: Network
# name: RBL Listings
# description: Ensures that no known external IP is DNS blacklisted. Requires the 'Network' inventory scanner for a list of external IPs.

NETWORK_DEFAULT_RBL_LIST="
cbl.abuseat.org
bl.spamcop.net
ix.dnsbl.manitu.net
zen.spamhaus.org
b.barracudacentral.org
"
NETWORK_RBL_LOOKUP_RATE=${NETWORK_RBL_LOOKUP_RATE-25}
NETWORK_RBL_LIST=${RBL_LIST-$NETWORK_DEFAULT_RBL_LIST}

ips=$(rgrep 'External IPs' "$RESULT_DIR/" | sed "s/.*|||//" | xargs | sort -u)

count=0
failed=0
for i in $ips; do
	ri=$(echo ${i/\/*} | awk -F. '{for(i=NF;i>0;--i)printf "%s.",$i}')
	results=
	for r in $NETWORK_RBL_LIST; do
		count=$(( count + 1 ))
		if [ $count -gt "$NETWORK_RBL_LOOKUP_RATE" ]; then
			count=0
			sleep 1
		fi
		if [[ $(dig +short "${ri}${r}") != "" ]]; then
			results="${results}$r "
		fi
	done

	if [ "$results" != "" ]; then
		echo "Global Network FAILED |||RBL Listings||| DNS black listing of $i: $results"
		failed=1
	fi
done

if [ $failed -eq 0 ]; then
	echo "Global Network OK |||RBL Listings||| All external IPs are fine with RBLs: $NETWORK_RBL_LIST"
fi
