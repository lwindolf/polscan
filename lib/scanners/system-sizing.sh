# group: System
# name: Sizing
# description: Inventory scanner for CPU, RAM

# Poor mans CPU count
cpucount=$(grep -c processor /proc/cpuinfo)

memory=$(grep MemTotal: /proc/meminfo)
memory=${memory/*:/}
memory=${memory/ kB/}
# Fix rounding errors by adding 100MB :-(
memory=$(( (($memory / 1024) + 100) / 1024 ))

result_ok "Server sizing: ${cpucount-unknown} CPU ${memory-unknown} GB RAM"
