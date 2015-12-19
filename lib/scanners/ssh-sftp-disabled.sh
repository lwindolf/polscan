# group: SSH
# name: SFTP disabled
# description: SFTP subsystem must not be enabled in /etc/ssh/sshd_config

if grep -q "Subsystem[[:space:]]*sftp[[:space:]]*.*sftp-server" /etc/ssh/sshd_config 2>/dev/null; then
	result_failed "SFTP subsystem is enabled, but should not be!"
fi
