#!/bin/bash

current_host=$1
export LC_ALL=C

# Detect Puppet version
if [ -f /var/lib/puppet/state/last_run_report.yaml ]; then
	# Puppet 2/3
	puppet_report=/var/lib/puppet/state/last_run_report.yaml
	puppet_version=23
elif [ -f /opt/puppetlabs/puppet/cache/state/last_run_report.yaml ]; then
	# Puppet 4
	puppet_report=/opt/puppetlabs/puppet/cache/state/last_run_report.yaml
	puppet_version=4
fi
