# group: Network
# name: All Log Martians
# description: Ensures logging of all suspicious packages

if [[ $(sysctl -n net.ipv4.conf.all.log_martians 2>/dev/null) == 1 ]]; then
	result_failed "net.ipv4.conf.all.log_martians is not 1"
fi
