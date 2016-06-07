# group: Security
# name: Tomcat Admin
# description: Check for insane tomcat admin default password 'admin' as there as just to many places online suggesting this.
# source: https://geekflare.com/apache-tomcat-hardening-and-security-guide/

if rgrep -q "password=.admin." /etc/tomcat*/tomcat-users.xml /var/lib/tomcat*/conf/tomcat-users.xml 2>/dev/null; then
	result_failed "Evil tomcat password detected!"
else
	result_ok
fi
