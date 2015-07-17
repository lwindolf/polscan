# group: Security
# name: SELinux enabled
# description: Uses 'sestatus' to check if SELinux is enabled. Checks grub.cfg for not having selinux=0.
# tags: CCE-26956-3

if ! sestatus 2>/dev/null | grep -q enabled; then
	result_failed "sestatus does not report 'enabled'"
fi

if grep -q "^[[:space:]]*[^#]selinux=0" /boot/grub/grub.cfg; then
	result_failed "SELinux disabled in grub.cfg"
fi

