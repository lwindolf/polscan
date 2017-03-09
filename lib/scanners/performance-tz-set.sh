# group: Performance
# name: TZ is set
# description: On production servers the TZ env variable should be set to avoid filesystem stat() syscalls for timezone change detection via /etc/localtime on each call to Glibc localtime() 
# solution-cmd: echo 'TZ=:/etc/localtime' >>/etc/environment.txt
# https://blog.packagecloud.io/eng/2017/02/21/set-environment-variable-save-thousands-of-system-calls/

if [ "$TZ" == "" ]; then
	result_failed "Environment variable TZ is not set!"
else
	result_ok "TZ is set to '$TZ'"
fi
