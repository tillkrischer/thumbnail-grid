cronschedule="* * * * *"
variableinit="DIR=${DIR}"
command="npm start --prefix /user/src/app"
pipe=">/proc/1/fd/1 2>/proc/1/fd/2"
cronstatement="${cronschedule} ${variableinit} ${command} ${pipe}"

echo "$cronstatement" > /etc/cron.d/update-dns
crontab /etc/cron.d/update-dns
cron -f