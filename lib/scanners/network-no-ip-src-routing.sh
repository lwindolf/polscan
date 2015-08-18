# group: Network
# name: No IP Source Routing
# description: Ensures that IP Source Routing is disabled
# tags: CCE-27037-1
# solution-cmd: echo 'net.ipv4.conf.all.accept_source_route' >/etc/sysctl.d/50-net.ipv4.conf.all.accept_source_route.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.conf.all.accept_source_route 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.conf.all.accept_source_route is not 0"
fi
