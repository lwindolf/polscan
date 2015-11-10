# group: SSH
# name: AllowTcpForwarding no
# description: Checks /etc/ssh/sshd_config for AllowTcpForwarding no

if grep -q "AllowTcpForwarding no" /etc/ssh/sshd_config; then
	result_ok
else
	result_failed
fi
