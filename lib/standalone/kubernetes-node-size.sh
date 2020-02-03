#!/bin/bash

# group: System
# name: Inventory
# description: Inventory for kubernetes nodes

source $(dirname $0)/../scanner-functions.inc

k8s_node_size() {
	JSON=$(timeout -k 10 -s 9 5 kubectl get nodes -o json)
	NODES=$(jq "$JSON" '.items[].metadata.name')
	for n in $NODES; do
		/bin/echo "Processing $n" >&2
		cpucount=$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.capacity.cpu')
		memory=$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.capacity.memory')
		(
			echo "|||CPU RAM|||" "${cpucount}x${memory}"
			echo "|||OS Release|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.nodeInfo.osImage' | sed "s/ /_/g")"
			echo "|||kubelet Version|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.nodeInfo.kubeletVersion')"
			echo "|||Container Runtime|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.nodeInfo.containerRuntimeVersion')"
			echo "|||Kernel Version|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .status.nodeInfo.kernelVersion')"
			echo "|||Region|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .metadata.labels["failure-domain.beta.kubernetes.io/region"]')"
			echo "|||Zone|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .metadata.labels["failure-domain.beta.kubernetes.io/zone"]')"
			echo "|||Instance Type|||" "$(jq "$JSON" '.items[] | select(.metadata.name == "'$n'") | .metadata.labels["beta.kubernetes.io/instance-type"]')"
		) | sed "s/^/$n System INVENTORY /"
	done
}

foreach_kube_context k8s_node_size
