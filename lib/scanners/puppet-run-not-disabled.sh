#!/bin/bash

# group: Puppet-Run
# name: Not disabled
# description: Checks for Puppet 2/3/4 lock file indicating Puppet runs are disabled. Also checks if the puppet daemon is running.
# solution-cmd: /usr/bin/puppet agent --enable

if ! pgrep puppet >/dev/null; then
	result_failed "No Puppet process running!"
fi

puppet_state_dir=$(dirname "$puppet_report" 2>/dev/null)
if [ -d "$puppet_state_dir" ]; then
	if [ ! -f "$puppet_state_dir/puppetdlock" -a ! -f "$puppet_state_dir/agent_disabled.lock" ]; then
		result_ok
	else
		comment=$(sed 's/.*disabled_message":"\([^"]*\)"/\1/' "$puppet_state_dir/agent_disabled.lock" 2>/dev/null)
		result_failed "Agent disabled (reason: ${comment-unknown})!"
	fi
fi
