#!/bin/bash


# group: Network
# name: Connections
# description: Pseudo scanner collecting connections using netstat -tal. Results are used for graphing host connections

OUR_NETWORKS=${OUR_NETWORKS-127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16}
LISTEN_FILTER=${LISTEN_FILTER-53|22|5666|4949|25|631}

declare -a netmasks

# Load configured whitelisted networks
#
# Uses global $OUR_NETWORKS
load_nets() {
        # Note: configuration contains CIDR netmasks that we need
        # to convert to hex values for easy checking
        for cidr in $OUR_NETWORKS
        do
                if [[ $cidr =~ ([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)/([0-9]+) ]]; then
                        netmasks+=($(printf 'network=0x%02x%02x%02x%02x;netmask=0x%08x\n' ${BASH_REMATCH[1]} ${BASH_REMATCH[2]} ${BASH_REMATCH[3]} ${BASH_REMATCH[4]} $((2**32-2**(32-${BASH_REMATCH[5]})))))
                else
                        echo "ERROR: Invalid network address '$cidr'!" >&2
                fi
        done
}

# Match all whitelisted netmask against a given IP
#
# $1    IPv4 address
#
# Returns 1 if any netmask matches, 0 otherwise
match_nets() {
        local ip=$1

        if [[ $ip =~ ([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
                ip=$(printf '0x%02x%02x%02x%02x' ${BASH_REMATCH[1]} ${BASH_REMATCH[2]} ${BASH_REMATCH[3]} ${BASH_REMATCH[4]})
        else
                echo "ERROR: Invalid IP '$ip'!" >&2
                return 0
        fi

        for entry in ${!netmasks[*]}
        do
                eval "${netmasks[$entry]}"
                if [[ $(($ip & $netmask)) -eq $network ]]; then
                        return 1
                fi
        done

        return 0
}

load_nets

# Analyze listening services
unset listen_ports
while read proto recvq sendq localaddr remoteaddr state program rest; do
	localport=${localaddr##*:}

	if [[ ! $localport =~ $LISTEN_FILTER ]]; then
		listen_ports[$localport]=1
	fi
done < <(/bin/netstat -taln | grep -v " 127" | grep "^tcp.*LISTEN")

# Analyze connections
while read proto recvq sendq localaddr remoteaddr state program rest; do
	localip=${localaddr%%:*}
	localport=${localaddr##*:}
	remoteip=${remoteaddr%%:*}
	remoteport=${remoteaddr##*:}
	program=${program/ */}
	program=${program/:*/}
	program=${program/*\//}

	if [ "$remoteport" -gt 1023 ]; then
		remoteport=high	# reduce client ports
	fi
	if [ "$localport" -gt 1023 ]; then
		localport=high	# reduce client ports
	fi

	results="$results$localip:${program}-$localport:$remoteip:$remoteport "
done < <(/bin/netstat -talnp | egrep -v " 127|LISTEN" | grep "^tcp")

result_ok $(/bin/echo $results | xargs -n 1 | sort -u)
