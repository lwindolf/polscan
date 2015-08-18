# group: System
# name: Unattended Upgrades
# description: The Debian unattended-upgrades packages is installed and activated

if ! dpkg -l unattended-upgrades 2>/dev/null | grep -q '^ii'; then
	result_failed "Package unattended-upgrades is not installed"
else
	# Check for the config lines activating auto update of package list
	# and the upgrade itself
	patterns='
^APT::Periodic::Update-Package-Lists "[^0]
^APT::Periodic::Unattended-Upgrade "[^0]
'
	for pattern in $patterns
	do
		if ! rgrep -q "$pattern" /etc/apt/apt.conf.d/; then
			echo result_failed "Pattern >>>$pattern<<< not found /etc/apt/apt.conf.d/"
		fi
	done
fi
