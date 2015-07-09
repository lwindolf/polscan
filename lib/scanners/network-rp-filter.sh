# group: Network
# name: IP Spoofing
# description: Ensures that IP spoofing protection is enabled

if [[ $(sysctl -n net.ipv4.conf.all.rp_filter 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.conf.all.rp_filter is not 1"
fi
