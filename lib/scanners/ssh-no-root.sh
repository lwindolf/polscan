# group: SSH
# name: PermitRootLogin no
# description: Checks /etc/ssh/sshd_config for PermitRootLogin no

if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
	result_ok
else
	result_failed
fi
