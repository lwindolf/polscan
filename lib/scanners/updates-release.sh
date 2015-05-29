# group: Updates
# name: Distro Release
# description: Checks if distribution is still ok

vendor=$(lsb_release -si)
release=$(lsb_release -sr)
release=${release/\.*/}

case $vendor in
	Debian)
		if [ "${release-0}" -lt 7 ]; then
			check_warning "$vendor $release needs to be updated"
		fi
		;;
esac
