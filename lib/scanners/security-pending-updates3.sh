# group: Security
# name: Pending Updates
# description: There should be no pending security updates. This check uses aptitudes which needs to be installed.

pkgs=$(aptitude search '?and(~U,~Asecurity)' -F "%p=%V" --disable-columns)
if [ "$pkgs" != "" ]; then
	result_warning "Security upgrades pending:" $pkgs
else
	result_ok
fi
