# group: SSH
# name: UsePrivilegeSeparation
# description: Checks /etc/ssh/sshd_config for UsePrivilegeSeparation yes

if ! grep -q "UsePrivilegeSeparation[[:space:]]yes" /etc/ssh/sshd_config; then
	result_failed "UsePrivilegeSeparation is not yes"
fi
