#!/bin/bash
# group: Kubernetes
# name: kube2iam
# description: Check all namespaces for usage of kube2iam. Checks if kube2iam using namespace have a filter for allowed IAM roles.
# solution: Create a "iam.amazonaws.com/allowed-roles" annotation
# reference: https://github.com/jtblin/kube2iam#namespace-restrictions

source $(dirname $0)/../scanner-functions.inc

k8s_kube2iam_filter() {
	# As polscan doesn't support cluster results yet, we report
	# all findings against the first master node
	HOST=$(kubectl get nodes --selector='node-role.kubernetes.io/master' -o json | jq -r '.items[].metadata.name' | head -1)

	# Get list of namespace holding pods with kube2iam annotations
	K2IAM_NS=$(json "$(kubectl get pods -A -o json)" '.items[] | select(.metadata.annotations["iam.amazonaws.com/role"] != null) | .metadata.namespace' | uniq)

	# Get list of all namespaces with a kube2iam filter annotation
	K2IAM_FILTERED_NS=$(json "$(kubectl get ns -A -o json)" '.items[] | select(.metadata.annotations["iam.amazonaws.com/allowed-roles"] != null) | .metadata.name')

	# Diff both lists...
	missing=$(diff -u <(echo "$K2IAM_NS") <(echo "$KIAM_FILTERED_NS") | grep "^-")
	if [ "$missing" != "" ]; then
		echo "$HOST Kubernetes OK |||kube2iam||| Namespaces with missing kube2iam role filter annotation: $missing"
	else
		echo "$HOST Kubernetes OK |||kube2iam||| Found $(echo "$K2IAM_NS" | wc -l) namespaces using kube2iam and no problems"
	fi
}

foreach_kube_context k8s_kube2iam_filter
