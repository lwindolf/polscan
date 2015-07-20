# group: Security
# name: Pending Updates
# description: There should be no pending security updates. This check uses apt-show-versions which needs to be installed. 

pkgs=$(apt-show-versions 2>/dev/null | grep 'security upgradable' | cut -d: -f 1)
if [ "$pkgs" != "" ]; then
	result_warning "Security upgrades pending: $pkgs"
else
	result_ok
fi
