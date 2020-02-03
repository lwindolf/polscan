#!/bin/bash

# group: Kubernetes
# name: Helm Status
# description: Checks for broken Helm releases.
# solution: Perform 'helm rollback' on broken release

source $(dirname $0)/../scanner-functions.inc

k8s_helm_releases() {
	# As polscan doesn't support cluster results yet, we report
	# all findings against the first master node
	HOST=$(kubectl get nodes --selector='node-role.kubernetes.io/master' -o json | jq -r '.items[].metadata.name' | head -1)

	HELM_RELEASES=$(timeout -k 20 -s 9 15 helm ls)

	# Check for output header
	if [[ ! "$HELM_RELEASES" =~ REVISION ]]; then
		echo "$HOST Kubernetes FAILED |||Helm Status||| Failed to 'helm ls' ($HELM_RELEASES)"
		return
	fi

	failed=$(echo "$HELM_RELEASES" | grep FAILED | cut -f 1)
	if [ "$failed" != "" ]; then
		echo "$HOST Kubernetes FAILED |||Helm Status||| failed releases: $failed"
	else
		echo "$HOST Kubernetes OK |||Helm Status||| All fine."
	fi
}


if helm version -c 2>/dev/null | grep -q "SemVer.*v2"; then
	foreach_kube_context k8s_helm_releases
fi
