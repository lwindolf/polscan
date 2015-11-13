# group: Security
# name: Pending Updates
# description: There should be no pending updates. This check uses apt-show-versions which needs to be installed.

pkgs=$(
	apt-show-versions 2>/dev/null |\
	grep ' upgradeable to ' |\
	awk '{package=$1; gsub(/:.*/, "", package); print package "=" $5}'
)
if [ "$pkgs" != "" ]; then
	result_warning "Security upgrades pending:" $pkgs
else
	result_ok
fi
