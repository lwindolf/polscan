# group: Puppet-Run
# name: Not disabled
# description: Checks for Puppet 2/3/4 lock file indicating Puppet runs are disabled. Also checks if the puppet daemon is running.
# solution-cmd: /usr/bin/puppet agent --enable

if ! pgrep puppet >/dev/null; then
	result_failed "No Puppet process running!"
fi

puppet_state_dir=$(dirname $puppet_report)
if [ -d $puppet_state_dir ]; then
	if [ ! -f $puppet_state_dir/puppetdlock -a ! -f $puppet_state_dir/agent_disabled.lock ]; then
		result_ok
	else
		comment=$(cat $puppet_state_dir/agent_disabled.lock | sed 's/.*disabled_message":"\([^"]*\)"/\1/')
		result_failed "Agent disabled (reason: $comment)!"
	fi
fi
