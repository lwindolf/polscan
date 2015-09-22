# group: Security
# name: Pending Updates
# description: There should be no pending security updates. We consider all APT sources with "security" as providing security upgrades that need to be installed

security_repos=$(grep -h '^deb.*security' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null)
TMPFILE=$(mktemp) && {
	echo "$security_repos" >$TMPFILE
	pkgs=$(apt-get -s dist-upgrade -o Dir::Etc::SourceList=$TMPFILE 2>/dev/null | grep ^Inst | awk '{print $2}')
	if [ "$pkgs" != "" ]; then
		result_warning "Security upgrades pending:" $pkgs
	else
		result_ok
	fi
	rm $TMPFILE
}
