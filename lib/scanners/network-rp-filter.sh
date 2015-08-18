# group: Network
# name: IP Spoofing
# description: Ensures that IP spoofing protection is enabled
# tags: CCE-26979-5
# solution-cmd: echo 'net.ipv4.conf.all.rp_filter=1' >/etc/sysctl.d/50-net.ipv4.conf.all.rp_filter.conf

if [[ $(/sbin/sysctl -n net.ipv4.conf.all.rp_filter 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.conf.all.rp_filter is not 1"
fi
