# group: Network
# name: FQDN
# description: Ensure that the server has an FQDN configured.

if [[ $(/bin/hostname -f) ~ \. ]]; then
	result_ok
else
	result_failed "'/bin/hostname -f' doesn't return an FQDN!"
fi
