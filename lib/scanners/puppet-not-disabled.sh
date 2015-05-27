# group: Puppet
# name: Not disabled
# description: Checks for Puppet 2.7 puppetdlock file indicating Puppet runs are disabled

if [ ! -f /var/lib/puppet/state/puppetdlock ]; then
	result_ok
else
	result_failed
fi
