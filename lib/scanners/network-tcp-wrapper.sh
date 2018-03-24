#!/bin/bash

# group: Network
# name: TCP wrapper
# description: Ensure sane TCP wrapper config with "ALL: ALL" in hosts.deny and no "ALL: ALL" in hosts.allow

if ! grep "^ALL:[[:space:]]*ALL" /etc/hosts.deny 2>/dev/null; then
	result_failed "/etc/hosts.deny does not contain 'ALL: ALL'"
fi

if grep "^ALL:[[:space:]]*ALL" /etc/hosts.allow 2>/dev/null; then
	result_failed "/etc/hosts.allow does contain 'ALL: ALL'"
fi
