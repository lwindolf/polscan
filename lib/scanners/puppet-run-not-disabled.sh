# group: Puppet-Run
# name: Not disabled
# description: Checks for Puppet 2/3 lock file indicating Puppet runs are disabled
# solution-cmd: /usr/bin/puppet agent --enable

if [ -d /var/lib/puppet/state/ ]; then
	if [ ! -f /var/lib/puppet/state/puppetdlock -a ! -f /var/lib/puppet/state/agent_disabled.lock ]; then
		result_ok
	else
		result_failed
	fi
fi
