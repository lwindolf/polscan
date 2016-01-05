# group: System
# name: No local root mail
# description: There should be no local root mail. Policy checks wether /var/mail/root is less than 1kByte
# solution: Configure a mail alias for root to forward mails

if /usr/bin/find /var/mail -size +1k -name root >/dev/null 2>&1; then
	result_failed "/var/mail/root contains >1kB mails"
else
	result_ok
fi

