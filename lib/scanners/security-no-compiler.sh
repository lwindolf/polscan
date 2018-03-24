#!/bin/bash

# group: Security
# name: No compiler
# description: Production systems, especially frontends should have no compiler to prevent overly easy privilege escalation.
# tags: SV-32956r2_rule
# solution-cmd: apt-get purge c-compiler

if [ -f /usr/bin/cc ]; then
	result_failed "Compiler found: /usr/bin/cc"
else
	result_ok
fi
