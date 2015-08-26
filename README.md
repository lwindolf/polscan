# polscan

*polscan* (short for "Policy Scanner") allows you to make your Debian server configuration/security/automation policies explicit.

It is easily extensible by combining pre-installed check snippets with custom ones at runtime. To make it easy to use it comes with host discovery solutions for typical automation setups (Chef, Puppet, MCollective) as well as supporting host discovery by monitoring tools (Nagios, Icinga). Here is how it looks like:

*Overview Page*

![screenshot](http://lzone.de/images/polscan-screenshot1.png)

*Result Details*

![screenshot](http://lzone.de/images/polscan-screenshot2.png)

Note: polscan is intentionally limited to Debian and for simplicity tries not to implement any distro-specific dependencies.

How to run it
-------------

polscan keeps results on a daily basis so it makes sense to set up a daily cron.

Or just run it from the source directory

    ./polscan                          # To re-scan all hosts
    ./polscan -l 'server1 server2'     # To scan specific hosts

Access Results
--------------

For simplicity all results are store in files in plain text and JSON. The JSON files are used by the static HTML viewer that can be used to inspect the result archive.

To quickly expose the static results in any webservers document root run the following commands from the directory you installed polscan into:

    cp -r www /var/www/polscan
    mkdir /var/www/polscan/results
    ln -s /var/www/polscan/results results
