#!/bin/bash

# group: Network
# name: Connections
# description: Pseudo scanner collecting connections using "netstat -talp --numeric-hosts". Results are used for graphing host connections. This scanner enables the 'Net Map' feature. If scanners run as root/sudo will resolve local program names.
# feature: netmap

OUR_NETWORKS=${OUR_NETWORKS-127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16}
LISTEN_FILTER="^(${LISTEN_FILTER-ssh|nrpe|22|5666|4949})\$"
fqdn=$(hostname -f)

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
listen_inventory=
unset listen_ports
declare -A listen_ports
while read proto recvq sendq localaddr remoteaddr state program rest; do
	localport=${localaddr##*:}
	program=${program/ */}
	program=${program/:*/}
	program=${program/#*\//}

	if [[ ! $localport =~ $LISTEN_FILTER ]]; then
		listen_ports[$localport]=$program
		listen_inventory="$listen_inventory $program"
	fi
done < <(/bin/netstat -tlp --numeric-hosts | grep -v " 127" | grep "^tcp.*LISTEN")

# Analyze connections
while read proto recvq sendq localaddr remoteaddr state program rest; do
	localip=${localaddr%%:*}
	localport=${localaddr##*:}
	remoteip=${remoteaddr%%:*}
	remoteport=${remoteaddr##*:}
	program=${program/ */}
	program=${program/:*/}
	program=${program/#*\//}

	if [[ $localport =~ $LISTEN_FILTER ]]; then
		continue
	fi

	if [[ $remoteport =~ ^[0-9]*$ ]] && [ "$remoteport" -gt 1023 ]; then
		remoteport=high	# reduce client ports
	fi
	if [[ $localport =~ ^[0-9]*$ ]] && [ "${listen_ports[$localport]}" == "" ] && [ "$localport" -gt 1023 ]; then
		localport=high	# reduce client ports
	fi

	# Guess at connection direction
	if [ "${listen_ports[$localport]}" != "" ]; then
		direction=in
		if [ "$program" == "-" ]; then
			program=${listen_ports[$localport]}
		fi
	elif [ $remoteport == "high" ]; then
		direction=out	# probably true
	else
		direction=out
	fi
	printf "%s\n" "$program:$localip:$localport:$remoteip:$remoteport:$direction"
done < <(/bin/netstat -tap --numeric-hosts | egrep -v "( 127| ::1|LISTEN)" | grep "^tcp") |\

# Reduce and write TCP connection edges
xargs -n 1 | sort | uniq -c |
awk '{print $2 " " $1}' | sed "s/:/ /g" |\
while read program localip localport remoteip remoteport direction count; do
	if [ "$program" == "-" ]; then
		program="(unknown)"
	fi
	result_network_edge "TCP connection" "$program" "$localip" "$localport" "$remoteip" "$remoteport" "$direction" "$count"
done

# Write port inventory
result_inventory "running TCP services" $(/bin/echo $listen_inventory | xargs -n 1 | sort -u)
