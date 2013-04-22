#!/usr/bin/env python

from random import choice
import time
import json
import os

topicprefix = 'svgdash'
hosts = ['bind0', 'pdns0', 'smtp0', 'nsa', 'nsb', 'pdnsa', 'pdnsb', 'smtp1', 'ldap1' ]
nagios = [0, 1, 2 ]
levels = [5, 20, 30, 40, 50, 60, 70, 100 ]

while 1:

    topic = "%s/%s" % (topicprefix, choice(hosts))

    payload = {}
    payload['level'] =   choice(levels)
    payload['msg'] =   "hi"
    payload['status'] =   int(choice(nagios))

    string = json.dumps(payload)
    command = "mosquitto_pub -t %s -m '%s'" % (topic, string)
    print command
    os.system(command)
    time.sleep(1)
