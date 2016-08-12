# group: System
# name: Inventory
# description: Inventory only scanner determining kernel version with uname -r, locale, timezone, CPU+RAM GB count, OS release, RAID vendor, Uptime, NMI Watchdog Setting

result_inventory "Kernel Version" "$(uname -r)"
result_inventory "Default Locale" "$LANG"
result_inventory "Timezone" "$(cat /etc/timezone 2>/dev/null)"
result_inventory "Remote Mounts" "$(/bin/mount | awk '/:\//{print $1}' | xargs)"

cpucount=$(grep -c processor /proc/cpuinfo)
memory=$(grep MemTotal: /proc/meminfo | awk '{printf("%d\n", $2/1024/1024 + 0.5)}')

result_inventory "CPU RAM" "${cpucount}x${memory}"

result_inventory "OS Release" "$(/usr/bin/lsb_release -si)_$(/usr/bin/lsb_release -sr)"
result_inventory "OS Major Release" "$(/usr/bin/lsb_release -si)_$(/usr/bin/lsb_release -sr | sed 's/\..*//')"

# For RAID Vendor we rely on the superb Nagios check from Debian package 
# nagios-plugins-contrib which prints in format "<status>: <vendor>:[<results]"
result_inventory "RAID Vendor" "$(/usr/lib/nagios/plugins/check_raid 2>/dev/null | grep OK: | cut -d : -f 2)"

# FIXME; switch to comma separated lists instead of space separated,
# so we do not need to replace whitespaces here!
result_inventory "Server Type" "$(/usr/sbin/dmidecode -s system-product-name | grep -v '^#' | head -1 | sed "s/ /_/g")"

result_inventory "CPU Type" "$(/usr/sbin/dmidecode -s processor-version | grep -v "^#" | head -1 | sed "s/ /_/g")"

# Slotted Uptime (7d,14d,31d,3m,6m,1y). This can help spotting issues per HW type/age/server role.
days=$(( $(cut -d . -f 1 /proc/uptime) / 86400))
if [ "$days" != "" ]; then
        prev=0
        result=
        for d in 7 14 31 121 182 365; do
                if [ "$days" -lt $d ]; then
                        result=$prev
                        break;
                fi
                prev=$d
        done

        if [ "$result" != "" ]; then
                result_inventory "Uptime" $result
        else
                result_inventory "Uptime" 365
        fi
fi

result_inventory "NMI Watchdog" "$(cat /proc/sys/kernel/nmi_watchdog)"
