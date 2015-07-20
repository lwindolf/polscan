
# group: SSH
# name: No keyboard auth
# description: /etc/ssh/sshd_config must not have enabled keyboard-interactive authentication

if grep -q "^[[:space:]]*[^#]keyboard-interactive" /etc/ssh/sshd_config; then
	result_ok
else
	result_failed "Found keyboard-interactive in /etc/ssh/sshd_config"
fi
