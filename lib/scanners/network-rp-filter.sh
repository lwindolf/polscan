# group: Network
# name: IP Spoofing
# description: Ensures that IP spoofing protection is enabled
# source: http://people.redhat.com/swells/scap-security-guide/RHEL/7/output/table-rhel7-cces.html
# source: http://www.linuxtopia.org/online_books/linux_system_administration/securing_and_optimizing_linux/chap5sec60.html
# source: http://www.linuxsecurity.com/resource_files/documentation/tcpip-security.html
# source: http://www.cyberciti.biz/tips/linux-iptables-8-how-to-avoid-spoofing-and-bad-addresses-attack.html
# solution-cmd: echo 'net.ipv4.conf.all.rp_filter=1' >/etc/sysctl.d/50-net.ipv4.conf.all.rp_filter.conf

if [[ $(/sbin/sysctl -n net.ipv4.conf.all.rp_filter 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.conf.all.rp_filter is not 1"
fi
