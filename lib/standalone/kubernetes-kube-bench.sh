#!/bin/bash

# group: Kubernetes
# name: kube-bench
# description: Check all namespaces for kube-bench crons kube-bench-worker and kube-bench-master, to see if they are run daily and if it reports any problems
# reference: https://github.com/aquasecurity/kube-bench#running-in-a-kubernetes-cluster

source $(dirname $0)/../scanner-functions.inc

k8s_kube_bench() {
	# As polscan doesn't support cluster results yet, we report
	# all findings against the first master node
	HOST=$(kubectl get nodes --selector='node-role.kubernetes.io/master' -o json | jq -r '.items[].metadata.name' | head -1)

	# kube-bench documentation says to run two crons, one for workers, one
	# for master nodes. We check the result pod if it ran and its log output
	for type in master node; do
		# How to get pods older than (adapted to crons)
		# https://stackoverflow.com/questions/48934491/kubernetes-how-to-delete-pods-based-on-time-age-creation
		CRON_NS=$(timeout -k 10 -s 9 5 kubectl get pods -A -o go-template --template '{{range .items}}{{.metadata.name}} {{.metadata.namespace}} {{.metadata.creationTimestamp}}{{"\n"}}{{end}}' | awk '$3 >= "'$(date -d '24 hours ago' -Ins --utc | sed 's/+0000/Z/')'" { print $1,$2 }' | grep "kube-bench-$type" | head -1)
		CRON=${CRON_NS/ */}
		NS=${CRON_NS/* /}

		if [[ $CRON_NS = "" ]]; then
			echo "$HOST Kubernetes FAILED |||kube-bench||| No kube-bench-$type cron executed since yesterday!"
		else
			# Get cron output, filter all result lines that should start with [
			# and drop all INFO and PASS lines, report the rest
			output=$(timeout -k 10 -s 9 5 kubectl logs "$CRON" -n "$NS" | grep "^\[" | egrep -v "^\[(PASS|INFO)\]")
			echo "$output" | while read -r severity line; do
				polscan_severity="FAILED"
				if [ "$severity" = "[WARN]" ]; then
					polscan_severity="WARNING"
				fi
				echo "$HOST Kubernetes $polscan_severity |||kube-bench||| $severity $line"
			done

			if [ "$output" = "" ]; then
				echo "$HOST Kubernetes OK |||kube-bench||| All fine no problems reported."
			fi
		fi
	done
}

foreach_kube_context k8s_kube_bench
