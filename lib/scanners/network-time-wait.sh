# group: Network
# name: TCP Time Wait
# description: On frontend servers exposed to DoS you want basic settings to improve the pool of connections in state TIME_WAIT 
# source: https://rtcamp.com/tutorials/linux/sysctl-conf/
# solution-cmd: echo 'net.ipv4.tcp_tw_recycle = 1\nnet.ipv4.tcp_tw_reuse = 1' >/etc/sysctl.d/50-network-time-wait.conf && sysctl -p

if [[ $(/sbin/sysctl -n net.ipv4.tcp_tw_recycle 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.tcp_tw_recycle is not 1"
fi

if [[ $(/sbin/sysctl -n net.ipv4.tcp_tw_reuse 2>/dev/null) == 0 ]]; then
	result_failed "net.ipv4.tcp_tw_reuse is not 1"
fi

if [[ $(/sbin/sysctl -n net.ipv4.tcp_max_tw_buckets 2>/dev/null) -le 16384 ]]; then
	result_failed "net.ipv4.tcp_max_tw_buckets <= 16384. You should increase it significantly."
fi
