# group: Security
# name: PAM cracklib
# description: pam_cracklib.so is to be enabled in /etc/pam.d/* to enforce better passwords
# solution-cmdline: apt-get install libpam-cracklib

if ! rgrep -q "^password[[:space:]]*requisite[[:space:]]*pam_cracklib.so" /etc/pam.d/; then
	result_failed "pam_cracklib.so is not enabled in /etc/pam.d/"
else
	result_ok
fi

