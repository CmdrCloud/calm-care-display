"""
Minimal tzlocal shim for Python 3.7.

Replaces the tzlocal 5.2 egg which requires zoneinfo (Python 3.9+).
Provides get_localzone() and get_localzone_name() using only stdlib.
"""

import os
import subprocess


class _ZoneInfo:
    def __init__(self, key):
        self.key = key


def get_localzone():
    try:
        with open('/etc/timezone') as f:
            key = f.read().strip()
            if key:
                return _ZoneInfo(key)
    except Exception:
        pass

    try:
        link = os.readlink('/etc/localtime')
        parts = link.split('/zoneinfo/')
        if len(parts) > 1:
            return _ZoneInfo(parts[1])
    except Exception:
        pass

    try:
        result = subprocess.run(
            ['timedatectl', 'show', '-p', 'Timezone', '--value'],
            capture_output=True, text=True, timeout=5
        )
        key = result.stdout.strip()
        if key:
            return _ZoneInfo(key)
    except Exception:
        pass

    return _ZoneInfo('UTC')


def get_localzone_name():
    return get_localzone().key
