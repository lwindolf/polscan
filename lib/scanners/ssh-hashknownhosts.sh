
# group: SSH
# name: HashKnownHosts
# description: Checks /etc/ssh/ssh_config for HashKnownHosts yes

if grep -q "HashKnownHosts yes" /etc/ssh/ssh_config; then
	result_ok
else
	result_failed
fi
