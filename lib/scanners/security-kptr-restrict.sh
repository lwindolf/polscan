# group: Security
# name: kptr restricted
# description: Non-root users should have no access to kernel symbols in /proc/kallsyms
# solution-cmd: echo 'kernel.kptr_restrict = 1' >/etc/sysctl.d/50-kptr-restrict.conf && sysctl -p
# source: https://wiki.archlinux.org/index.php/Security

if [ $(/sbin/sysctl -n kernel.kptr_restrict 2>/dev/null) == "1" ]; then
	result_ok
else
	result_failed "Kernel symbols in /proc/kallsyms are not restricted to root only!"
fi
