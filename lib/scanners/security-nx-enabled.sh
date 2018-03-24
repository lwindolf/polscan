#!/bin/bash

# group: Security
# name: Execute Disable Support
# description: On Intel CPUs execute disable protection should be active
# tags: CCE-27001-4

if [[ $(dmesg | grep '[NX|DX]*protection: active') == "" ]]; then
	result_failed "Intel Execute Disable support not active!"
fi

