# name: SSH X11Forwarding no
# description: Checks /etc/ssh/sshd_config for X11Forwarding no

if grep -q "X11Forwarding no" /etc/ssh/sshd_config; then
	result_ok
else
	result_failed
fi
