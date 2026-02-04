
    0[||||||||||||                                                                                                          8.6%] Tasks: 83, 220 thr, 71 kthr; 1 running
    1[|||||||||||                                                                                                           7.9%] Load average: 9.95 5.55 2.63
  Mem[|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||1.57G/1.83G] Uptime: 1 day, 02:00:53
  Swp[|||||||||||||||||||||||||||                                                                                     618M/3.00G]

  [Main] [I/O]
    PID USER       PRI  NI  VIRT   RES▽  SHR S  CPU% MEM%   TIME+  Command
   4311 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:10.49 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4313 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   8791 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  40012 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:00.14 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  40013 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:04.01 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  40014 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:00.41 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  40339 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:02.25 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  40340 1032        20   0 1524M  458M 24796 S   0.0 24.5  0:00.16 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4315 1032        20   0 1526M  442M     0 S   0.0 23.7  0:16.78 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4316 1032        20   0 1526M  442M     0 S   0.0 23.7  0:00.01 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   8792 1032        20   0 1526M  442M     0 S   0.0 23.7  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39990 1032        20   0 1526M  442M     0 S   0.0 23.7  0:00.08 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39991 1032        20   0 1526M  442M     0 S   0.0 23.7  0:10.53 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39992 1032        20   0 1526M  442M     0 S   0.0 23.7  0:01.11 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44629 1032        20   0 1526M  442M     0 S   0.0 23.7  0:01.55 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44633 1032        20   0 1526M  442M     0 S   0.0 23.7  0:00.10 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4314 1032        20   0 1527M  441M     0 S   0.0 23.6  0:08.94 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4317 1032        20   0 1527M  441M     0 S   0.0 23.6  0:00.01 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   8793 1032        20   0 1527M  441M     0 S   0.0 23.6  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39987 1032        20   0 1527M  441M     0 S   0.0 23.6  0:00.08 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39988 1032        20   0 1527M  441M     0 S   0.0 23.6  0:03.72 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  39989 1032        20   0 1527M  441M     0 S   0.0 23.6  0:00.31 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44628 1032        20   0 1527M  441M     0 S   0.0 23.6  0:01.52 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44634 1032        20   0 1527M  441M     0 S   0.0 23.6  0:00.10 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44630 1032        20   0 1193M  331M  1212 S   0.0 17.7  0:04.28 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44631 1032        20   0 1193M  331M  1212 S   0.0 17.7  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44632 1032        20   0 1193M  331M  1212 S   0.0 17.7  0:00.18 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44635 1032        20   0 1193M  331M  1212 S   0.0 17.7  0:00.38 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  44636 1032        20   0 1193M  331M  1212 S   0.0 17.7  0:00.02 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4306 1032        20   0  883M  175M   372 S   0.0  9.4  0:16.27 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
   4309 1032        20   0  883M  175M   372 S   0.0  9.4  0:00.00 /app/venv/bin/python ./venv/bin/gunicorn -c scripts/gunicorn_conf.py --workers 4 --max-requests 250 --timeout 2400 --bind [::]:5000 wsgi:app()
  45724 root        20   0  290M 26020 16400 D   2.6  1.4  0:02.29 /www/server/panel/pyenv/bin/python3.7 /www/server/panel/script/push_msg.py
  45720 root        20   0  265M 19688  8640 D   2.6  1.0  0:02.07 /www/server/panel/pyenv/bin/python3.7 /www/server/panel/script/project_daemon.py
  39564 root        20   0 1593M 13852 13852 S   0.0  0.7  0:06.41 /root/golf-coach-demo/server
  39565 root        20   0 1593M 13852 13852 S   0.0  0.7  0:00.62 /root/golf-coach-demo/server
  39566 root        20   0 1593M 13852 13852 S   0.0  0.7  0:01.88 /root/golf-coach-demo/server
  39567 root        20   0 1593M 13852 13852 S   0.0  0.7  0:01.12 /root/golf-coach-demo/server
  39568 root        20   0 1593M 13852 13852 S   0.0  0.7  0:00.00 /root/golf-coach-demo/server
  39718 root        20   0 1593M 13852 13852 S   0.0  0.7  0:01.34 /root/golf-coach-demo/server
  45735 postgres    20   0  383M  9208  9208 S   0.0  0.5  0:00.23 postgres: postgres postgres ::1(33506) authentication
  37220 root        20   0  142M 12236 12236 S   0.7  0.6  3:25.23 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37221 root        20   0  142M 12236 12236 S   0.0  0.6  0:01.98 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37222 root        20   0  142M 12236 12236 S   0.0  0.6  0:02.13 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37223 root        10 -10  142M 12236 12236 S   0.0  0.6  0:02.56 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37224 root        10 -10  142M 12236 12236 S   0.0  0.6  0:19.91 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37225 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.32 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37226 root        10 -10  142M 12236 12236 S   0.0  0.6  0:10.34 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37227 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.07 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37228 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.24 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37229 root        10 -10  142M 12236 12236 S   0.0  0.6  0:01.20 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37230 root        10 -10  142M 12236 12236 S   0.0  0.6  0:07.46 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37231 root        10 -10  142M 12236 12236 S   0.0  0.6  0:04.24 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37232 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.21 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37233 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.03 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37234 root        10 -10  142M 12236 12236 S   0.7  0.6  0:42.32 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37235 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.35 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37236 root        10 -10  142M 12236 12236 S   0.0  0.6  0:05.21 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37237 root        10 -10  142M 12236 12236 S   0.0  0.6  0:03.41 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37238 root        10 -10  142M 12236 12236 S   0.0  0.6  0:05.63 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37239 root        10 -10  142M 12236 12236 S   0.0  0.6  0:03.65 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37240 root        10 -10  142M 12236 12236 S   0.0  0.6  0:01.04 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37241 root        10 -10  142M 12236 12236 S   0.0  0.6  0:05.86 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37242 root        10 -10  142M 12236 12236 R   0.0  0.6  0:58.97 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37243 root        10 -10  142M 12236 12236 S   0.0  0.6  0:05.71 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37244 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.26 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37245 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.56 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37246 root        10 -10  142M 12236 12236 S   0.0  0.6  0:00.12 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37252 root        10 -10  142M 12236 12236 S   0.0  0.6  0:02.99 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
  37259 root        20   0  142M 12236 12236 S   0.0  0.6  0:00.01 /usr/local/aegis/aegis_client/aegis_12_81/AliYunDunMonitor
    896 root        20   0 1497M  9212  9212 S   1.3  0.5 13:29.33 /usr/local/cloudmonitor/bin/argusagent
    907 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.73 /usr/local/cloudmonitor/bin/argusagent
   1569 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1570 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1571 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1572 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1573 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1574 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.78 /usr/local/cloudmonitor/bin/argusagent
   1575 root        20   0 1497M  9212  9212 S   0.0  0.5  0:48.64 /usr/local/cloudmonitor/bin/argusagent
   1576 root        20   0 1497M  9212  9212 S   0.0  0.5  0:30.80 /usr/local/cloudmonitor/bin/argusagent
   1578 root        20   0 1497M  9212  9212 S   0.0  0.5  2:37.05 /usr/local/cloudmonitor/bin/argusagent
   1579 root        20   0 1497M  9212  9212 S   0.0  0.5  2:37.47 /usr/local/cloudmonitor/bin/argusagent
   1580 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1581 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1582 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1583 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1584 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1585 root        20   0 1497M  9212  9212 S   0.0  0.5  0:04.09 /usr/local/cloudmonitor/bin/argusagent
   1589 root        20   0 1497M  9212  9212 S   0.0  0.5  0:03.52 /usr/local/cloudmonitor/bin/argusagent
   1590 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.39 /usr/local/cloudmonitor/bin/argusagent
   1591 root        20   0 1497M  9212  9212 S   0.0  0.5  2:30.04 /usr/local/cloudmonitor/bin/argusagent
   1592 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1593 root        20   0 1497M  9212  9212 S   0.0  0.5  0:51.22 /usr/local/cloudmonitor/bin/argusagent
   1594 root        20   0 1497M  9212  9212 S   0.0  0.5  0:21.95 /usr/local/cloudmonitor/bin/argusagent
   1595 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.04 /usr/local/cloudmonitor/bin/argusagent
   1596 root        20   0 1497M  9212  9212 S   0.0  0.5  0:01.63 /usr/local/cloudmonitor/bin/argusagent
   1597 root        20   0 1497M  9212  9212 S   0.0  0.5  0:04.35 /usr/local/cloudmonitor/bin/argusagent
   1598 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.37 /usr/local/cloudmonitor/bin/argusagent
   1599 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.38 /usr/local/cloudmonitor/bin/argusagent
   1600 root        20   0 1497M  9212  9212 S   0.0  0.5  0:00.00 /usr/local/cloudmonitor/bin/argusagent
   1601 root        20   0 1497M  9212  9212 S   0.0  0.5  0:25.53 /usr/local/cloudmonitor/bin/argusagent
   1602 root        20   0 1497M  9212  9212 S   0.0  0.5  2:11.03 /usr/local/cloudmonitor/bin/argusagent
  42082 root        20   0 1497M  9212  9212 S   0.0  0.5  0:06.32 /usr/local/cloudmonitor/bin/argusagent
  42083 root        20   0 1497M  9212  9212 S   0.0  0.5  0:06.22 /usr/local/cloudmonitor/bin/argusagent
  42084 root        20   0 1497M  9212  9212 S   0.0  0.5  0:06.39 /usr/local/cloudmonitor/bin/argusagent
  45575 root        20   0  223M  7536  3648 R   2.0  0.4  0:02.10 htop
  45009 root        20   0  221M  7432  2848 S   0.0  0.4  0:00.11 bash
  44727 root        20   0 16764  7024  6968 S   0.0  0.4  0:00.04 sshd: admin [priv]
  44848 root        20   0 16764  7004  6948 S   0.0  0.4  0:00.02 sshd: admin [priv]
  44684 admin       20   0 20192  6364  5004 S   0.0  0.3  0:00.06 /usr/lib/systemd/systemd --user
    459 root        20   0 69504  7800  7684 S   0.0  0.4  0:01.84 /usr/lib/systemd/systemd-journald
F1Help  F2Setup F3SearchF4FilterF5Tree  F6SortByF7Nice -F8Nice +F9Kill  F10Quit
