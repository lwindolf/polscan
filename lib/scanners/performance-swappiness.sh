# group: Performance
# name: Swappiness = 1
# description: Swappiness should be reduced as much as possible on databases of all kinds. Note: due to OOM behaviour since Linux 2.6.32+ swappiness=0 is dangerous, so to be safe we stay with swappiness=1 and throw a warning on swappiness=0.
# solution-cmd: echo 'swappiness = 1' >/etc/sysctl.d/50-swappiness.conf && sysctl -p
# source: http://blog.couchbase.com/often-overlooked-linux-os-tweaks
# source: https://www.elastic.co/guide/en/elasticsearch/guide/current/heap-sizing.html
# source: https://www.percona.com/blog/2014/04/28/oom-relation-vm-swappiness0-new-kernel/
# source: http://www.cloudera.com/content/cloudera/en/documentation/cloudera-search/v1-latest/Cloudera-Search-User-Guide/csug_tuning_solr.html
# source: https://mariadb.com/kb/en/mariadb/configuring-swappiness/
# source: http://docs.oracle.com/cd/E24290_01/coh.371/e22838/tune_perftune.htm#COHAG223
# source: http://java.dzone.com/articles/OOM-relation-to-swappiness

value=$(/sbin/sysctl -n swappiness 2>/dev/null)
if [ "$value" -gt 1 ]; then
	result_failed "sysctl swappiness != 1"
elif [ "$value" -eq 0 ]; then
	result_warning "sysctl swappiness=0, this can cause OOM kills!"
elif [ "$value" -eq 1 ]; then
	result_ok
fi

