# group: SSH
# name: Strict Mode enabled
# description: Checks /etc/ssh/sshd_config for StrictModes yes

if grep -q "StrictModes yes" /etc/ssh/sshd_config 2>/dev/null; then
	result_ok
else
	result_failed
fi
