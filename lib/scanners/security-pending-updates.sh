# group: Security
# name: Pending Updates
# description: There should be no pending security updates. We consider all APT sources with "security" as providing security upgrades that need to be installed

security_repos=$(grep -h '^deb.*security' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null)
TMPFILE=$(mktemp) && {
	/bin/echo "$security_repos" >$TMPFILE
	pkgs=$(
		# Typical apt-get -s dist-upgrade output:
		#
		# Inst liberror-perl (0.17-1 Debian:7.9/oldstable [all])
		# Inst libfcgi0ldbl [2.4.0-8.1] (2.4.0-8.1+deb7u1 Debian:7.9/oldstable [amd64])
		#
		# Note the extra version in line 2
		apt-get -s dist-upgrade -o Dir::Etc::SourceList=$TMPFILE 2>/dev/null |\
		grep ^Inst |\
		awk '{if($3 ~ /\[/) { version=$4} else { version=$3 }; gsub(/\(/, "", version); print $2 "=" version}'
	)
	if [ "$pkgs" != "" ]; then
		result_warning "Security upgrades pending:" $pkgs
	else
		result_ok
	fi
	rm $TMPFILE
}
