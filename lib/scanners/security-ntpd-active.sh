# group: Security
# name: ntpd on
# description: There must be a running ntpd
# tags: CCE-27093-4

if ! pgrep -f ntpd >/dev/null; then
	result_failed "No running 'ntpd' process found!"
fi
