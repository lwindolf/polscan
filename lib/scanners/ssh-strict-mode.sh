# group: SSH
# name: Strict Modes enabled
# description: Checks /etc/ssh/sshd_config for StrictModes no
# solution-cmd: sed -i 's/StrictModes.*no/StrictModes yes/' /etc/ssh/sshd_config

if grep -q "StrictModes no" /etc/ssh/sshd_config 2>/dev/null; then
	result_failed
else
	result_ok
fi
