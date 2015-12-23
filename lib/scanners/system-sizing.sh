# group: System
# name: CPU RAM
# description: Inventory only scanner determining the CPUs and RAM GB count

cpucount=$(grep -c processor /proc/cpuinfo)

memory=$(grep MemTotal: /proc/meminfo | awk '{printf("%d\n", $2/1024/1024 + 0.5)}')

result_inventory "CPU RAM" "${cpucount}x${memory}"
