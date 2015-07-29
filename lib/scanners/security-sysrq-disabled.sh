# group: Security
# name: No SysRq
# description: /proc/sys/kernel/sysrq is to be 0

if [[ $(/sbin/sysctl -n /proc/sys/kernel/sysrq 2>/dev/null) != "0" ]]; then
	result_failed "sysctl /proc/sys/kernel/sysrq != 0"
fi

