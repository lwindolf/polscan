# group: Network
# name: Hostname and FQDN resolve local
# description: Ensures that the hostname and the FQDN resolve to an IP of a local interface

local_ips=$(ip a | sed '/inet /!d; s/^.* inet \([0-9][0-9\.]*\)\/.*$/\1/' | grep -v "^127.")
short=$(hostname -s)
fqdn=$(hostname -f)
result_short=$(getent hosts $short)
result_fqdn=$(getent hosts $fqdn)
if [ "$result_short" != "$result_fqdn" ] ; then
	result_failed "/etc/hosts resolves '$short' differently than '$fqdn'"
fi

if [ "$result_short" == "" ]; then
	result_failed "NSS doesn't resolve '$short'"
else
	ip=${result_short/ */}
	if ! echo "$local_ips" | grep -q "$ip"; then
		result_warning "$short doesn't resolve to a NIC IP ($ip)"
	fi
fi

if [ "$result_fqdn" == "" ]; then
	result_failed "NSS doesn't resolve '$fqdn'"
else
	ip=${result_fqdn/ */}
	if ! echo "$local_ips" | grep -q "$ip"; then
		result_warning "$fqdn doesn't resolve to a NIC IP ($ip)"
	fi
fi
