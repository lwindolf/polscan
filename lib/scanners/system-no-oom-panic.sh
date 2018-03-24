#!/bin/bash

# group: System
# name: No Panic on OOM
# description: /proc/sys/vm/panic_on_oom is to be 0. /proc/sys/vm/overcommit_memory is to be 2. This is usually NOT a good idea because an OOM situation causes undefined behaviour.
# solution-cmd: echo 'vm.panic_on_oom = 0' >/etc/sysctl.d/50-vm.panic_on_oom.conf; echo 'vm.overcommit_memory = 2' >/etc/sysctl.d/50-vm.overcommit_memory.conf; sysctl -p
# source: http://www.oracle.com/technetwork/articles/servers-storage-dev/oom-killer-1911807.html
# source: http://www.debuntu.org/how-to-reboot-on-oom/

if [[ $(/sbin/sysctl -n vm.panic_on_oom 2>/dev/null) != "0" ]]; then
	result_failed "sysctl vm.panic_on_oom != 0"
fi
if [[ $(/sbin/sysctl -n vm.overcommit_memory 2>/dev/null) != "2" ]]; then
	result_failed "sysctl vm.overcommit_memory != 2"
fi

