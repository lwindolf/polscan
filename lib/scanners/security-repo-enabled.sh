# group: Security
# name: Security Repo
# description: Ensure the security.debian.org repo is enabled

if grep -q '^deb[[:space:]]*http://security.debian.org.*main' /etc/apt/sources.list /etc/apt/sources.list.d/* 2>/dev/null; then
	result_ok
else
	result_failed "Debian security updates repo not found in /etc/apt/source.list*!"
fi
