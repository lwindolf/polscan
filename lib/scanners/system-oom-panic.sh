# group: System
# name: Panic on OOM
# description: /proc/sys/vm/panic_on_oom is to be 1. /proc/sys/kernel.panic is to be > 0. This prevents undefined service behaviour on OOM
# solution-cmd: echo 'vm.panic_on_oom = 1' >/etc/sysctl.d/50-vm.panic_on_oom.conf; sysctl -p; echo 'kernel.panic = 1' >/etc/sysctl.d/50-kernel.panic.conf; sysctl -p

if [[ $(/sbin/sysctl -n vm.panic_on_oom 2>/dev/null) != "1" ]]; then
	result_failed "sysctl vm.panic_on_oom != 1"
fi
if [[ $(/sbin/sysctl -n kernel.panic 2>/dev/null) != "0" ]]; then
	result_failed "sysctl kernel.panic != 0"
fi
