# group: Security
# name: dmesg restricted
# description: Non-root users should have no access to sensitive infos in dmesg
# solution-cmd: echo 'kernel.dmesg_restrict = 1' >/etc/sysctl.d/50-dmesg-restrict.conf && sysctl -p
# source: https://wiki.archlinux.org/index.php/Security

if [ $(/sbin/sysctl -n kernel.dmesg_restrict) == "1" ]; then
	result_ok
else
	result_failed "dmesg is not restricted to root only!"
fi
