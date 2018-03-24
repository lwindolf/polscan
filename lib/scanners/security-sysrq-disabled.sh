#!/bin/bash

# group: Security
# name: No SysRq
# description: /proc/sys/kernel/sysrq is to be 0
# solution-cmd: echo 'kernel.sysrq = 0' >/etc/sysctl.d/50-kernel.sysrq.conf && sysctl -p

if [[ $(/sbin/sysctl -n kernel.sysrq 2>/dev/null) != "0" ]]; then
	result_failed "sysctl kernel.sysrq != 0"
fi

