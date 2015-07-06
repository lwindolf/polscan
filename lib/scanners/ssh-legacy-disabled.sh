# group: SSH
# name: Legacy Options
# description: Checks /etc/ssh/sshd_config for disabled legacy features: IgnoreRhosts yes, HostbasedAuthentication no, RhostsRSAAuthentication no, Protocol 2 (no 1)

if ! grep -q "IgnoreRhosts yes" /etc/ssh/sshd_config; then
	result_failed "IgnoreRhosts is not set to yes"
fi

if ! grep -q "HostbasedAuthentication no" /etc/ssh/sshd_config; then
	result_failed "HostbasedAuthentication is not set to no"
fi

if ! grep -q "RhostsRSAAuthentication no" /etc/ssh/sshd_config; then
	result_failed "RhostsRSAAuthentication is not set to no"
fi

if ! grep -q "Protocol 2" /etc/ssh/sshd_config; then
	result_failed "Protocol is not set to 2"
fi
