# group: System
# name: RAID State
# description: There should be no RAID errors. Uses Nagios plugin check_raid from Debian package nagios-plugins-contrib to check RAID errors.

if [ -x /usr/lib/nagios/plugins/check_raid ]; then
	output=$(/usr/lib/nagios/plugins/check_raid)
	case $? in
		1) result_warning "RAID State" "$output" ;;
		2) result_critical "RAID State" "$output" ;;
		0) result_ok "RAID State" "$output";;
	esac
fi
