#!/bin/bash

# group: System
# name: Disk Space
# description: Simple policy that ensure disks won't run full within the next 3 days using a 14 day interval of samples. Uses average growth in this interval to predict days to disk full. Warns if disk will be full in 7 days, critical when disk full in 3 days.

FS_SPACE_HISTORY=${FS_SPACE_HISTORY-/tmp/.polscan_fs_space_history}
FS_SPACE_HISTORY_INTERVAL=${FS_SPACE_HISTORY_INTERVAL-14}
FS_SPACE_MIN_VALUE_COUNT=3
FS_SPACE_WARNING_DAYS=7
FS_SPACE_CRITICAL_DAYS=3

today=$(date +%Y%m%d)
old=$(date -d "$FS_SPACE_HISTORY_INTERVAL days ago" +%Y%m%d)

# Read old values and add current ones
values=$(
	(
	while read mount day available; do
		if [ "$day" -ge $old -a "$day" -ne "$today" ]; then
			/bin/echo "$mount $day $available"
		fi
	done < <(tail -$(( $FS_SPACE_HISTORY_INTERVAL - 1 )) "$FS_SPACE_HISTORY")

	while read device fs blocks used available percent mount rest; do
		/bin/echo "$mount $today $available"
	done < <(
		/bin/df -lTm | /bin/egrep -v "tmpfs|Filesystem"
	)
	) | sort -u
)

# Save new values
/bin/echo "$values" >${FS_SPACE_HISTORY} 2>/dev/null

# Calculate diffs
prevMount=
echo "$values
" |\
while read mount day available rest; do
	if [ "$mount" == "$prevMount" -a "$day" != "$prevDay" ]; then
		diff=$(( $prevValue - $available ))
		# We are only interested in daily space increases
		if [ $diff -gt 0 ]; then
			diffsum=$(( $diffsum + $diff))
		fi
		diffcount=$(( $diffcount + 1 ))
	else
		# Analyze 
		if [ "$prevMount" != "" ]; then
			if [ "${diffcount-0}" -ge $FS_SPACE_MIN_VALUE_COUNT ]; then
				if [ ${diffsum-0} -gt 0 ]; then
					days_left=$(( $prevValue * $diffcount / $diffsum ))
					message="$prevMount is probably full in $days_left days (grows $(( $diffsum / $diffcount)) MiB/day)"
					if [ "$days_left" -le $FS_SPACE_CRITICAL_DAYS ]; then
						result_failed "$message"
					elif [ "$days_left" -le $FS_SPACE_WARNING_DAYS ]; then
						result_warning "$message"
					else
						result_ok "$message"
					fi
				else
					result_ok "$prevMount usage has no growth since $diffcount days"
				fi
			else
				result_ok "$prevMount usage unknown, not enough samples..."
			fi
		fi
		# Reset
		diffsum=0
		diffcount=0
	fi
	prevValue=$available
	prevMount=$mount
	prevDay=$day
done
