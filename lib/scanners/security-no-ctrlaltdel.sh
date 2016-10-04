# group: Security
# name: Ctrl-Alt-Del disabled
# description: Reboot via console Ctrl-Alt-Del should be disabled
# solution-cmd: sed -i "/^[^#]ctrlaltdel/s/^/#/" /etc/inittab

if grep -q "^[[:space:]]*[^#].*:ctrlaltdel:" /etc/inittab 2>/dev/null; then
	result_failed "Ctrl-Alt-Del is allowed in /etc/inittab"
fi
