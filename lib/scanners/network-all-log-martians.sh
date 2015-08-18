# group: Network
# name: All Log Martians
# description: Ensures logging of all suspicious packages
# solution-cmd: echo 'net.ipv4.conf.all.log_martians=1' >/etc/sysctl.d/50-net.ipv4.conf.all.log_martians.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.conf.all.log_martians 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.conf.all.log_martians is not 1"
fi
