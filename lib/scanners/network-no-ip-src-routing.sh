#!/bin/bash

# group: Network
# name: No IP Source Routing
# description: Ensures that IP Source Routing is disabled
# source: http://people.redhat.com/swells/scap-security-guide/RHEL/7/output/table-rhel7-cces.html
# solution-cmd: echo 'net.ipv4.conf.all.accept_source_route = 0' >/etc/sysctl.d/50-net.ipv4.conf.all.accept_source_route.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.conf.all.accept_source_route 2>/dev/null) != 0 ]]; then
	result_failed "net.ipv4.conf.all.accept_source_route is not 0"
fi
