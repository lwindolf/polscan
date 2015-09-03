# group: Network
# name: Ignore ICMP
# description: Ensures that ICMP requests are ignored
# source: http://www.linuxsecurity.com/content/view/111337/65/
# source: http://www.thegeekstuff.com/2010/07/how-to-disable-ping-replies-in-linux/
# source: http://www.linuxhowtos.org/Security/disable_ping.htm
# solution-cmd: echo 'net.ipv4.icmp_echo_ignore_all=1' >/etc/sysctl.d/50-net.ipv4.icmp_echo_ignore_all.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.icmp_echo_ignore_all 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.icmp_echo_ignore_all is not 1"
fi
