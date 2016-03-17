# group: SSH
# name: Strict Mode enabled
# description: Checks /etc/ssh/sshd_config for StrictMode yes
# solution-cmd: sed -i 's/StrictMode*no/StrictMode yes/' /etc/ssh/sshd_config

if grep -q "StrictModes yes" /etc/ssh/sshd_config 2>/dev/null; then
	result_ok
else
	result_failed
fi
