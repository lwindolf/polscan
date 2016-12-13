# group: SSH
# name: UsePrivilegeSeparation
# description: Checks /etc/ssh/sshd_config for UsePrivilegeSeparation no
# solution-cmd: sed -i 's/UsePrivilegeSeparation.*no/UsePrivilegeSeparation yes/' /etc/ssh/sshd_config

if grep -q "UsePrivilegeSeparation[[:space:]]no" /etc/ssh/sshd_config 2>/dev/null; then
	result_failed "UsePrivilegeSeparation is not yes"
else
	result_ok
fi
