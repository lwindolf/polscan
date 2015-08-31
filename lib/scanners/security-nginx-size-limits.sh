# group: Security
# name: nginx size limits
# description: An nginx production webserver should prevent buffer attacks. While there are defaults for the different client request buffer setting and size limits it might be worth minimizing the as much as possible.
# solution-cmd: printf "client_body_buffer_size 1K;\nclient_header_buffer_size 1k;\nclient_max_body_size 1k;\nlarge_client_header_buffers 2 1k;\n" >/etc/nginx/conf.d/50-size-limits.conf
# source: http://www.cyberciti.biz/tips/linux-unix-bsd-nginx-webserver-security.html
# source: http://nginx.org/en/docs/http/ngx_http_core_module.html#client_body_buffer_size
# source: http://nginx.org/en/docs/http/ngx_http_core_module.html#client_header_buffer_size
# source: http://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size
# source: http://nginx.org/en/docs/http/ngx_http_core_module.html#large_client_header_buffers

settings="
client_body_buffer_size
client_header_buffer_size
client_max_body_size
large_client_header_buffers
"

locations="/etc/nginx /usr/local/nginx/conf"

for dir in $locations; do
	if [ -d $dir ]; then
		for s in $settings; do
			if ! rgrep -q "$s[[:space:]][[:space:]]*[1-9]" $dir/*-enabled $dir/conf.d; then
				result_failed "$s is not set anywhere in $locations"
			fi
		done
	fi
done
