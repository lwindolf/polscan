# group: Network
# name: No entries in /etc/hosts
# description: Ensures that there are no extra entries in /etc/hosts

output=$(cat /etc/hosts | egrep -v "localhost|$HOSTNAME|^#|ip6|^ *$")
if [ "$output" != "" ]; then
	result_failed "Unexpected entries in /etc/hosts: $output"
fi
