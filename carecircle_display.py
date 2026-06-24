#!/usr/bin/env python3
"""
CareCircle E-Ink Display Script
Runs on Raspberry Pi 3, Raspbian Buster, Python 3.7.3
Fetches care data from backend API and displays on Waveshare 7.5" E-Ink v2 display
"""

import sys
import os
import json
import time
import logging
import socket
from datetime import datetime

import types, typing, importlib.util
if not hasattr(typing, 'Literal'):
    class _Literal(object):
        def __class_getitem__(cls, item):
            return cls
    typing.Literal = _Literal
def _stub(name):
    m = types.ModuleType(name)
    sys.modules[name] = m
    return m
_ink     = _stub('inkycal')
_ink_d   = _stub('inkycal.display')
_ink_drv = _stub('inkycal.display.drivers')
_ink.display   = _ink_d
_ink_d.drivers = _ink_drv
_DRIVERS = '/home/pi/Inkycal/inkycal/display/drivers'
def _ink_drv_getattr(name):
    if name == 'epdconfig':
        _spec = importlib.util.spec_from_file_location('epdconfig', _DRIVERS + '/epdconfig.py')
        _ec = importlib.util.module_from_spec(_spec)
        sys.modules['epdconfig'] = _ec
        _spec.loader.exec_module(_ec)
        setattr(sys.modules['inkycal.display.drivers'], 'epdconfig', _ec)
        return _ec
    raise AttributeError(name)
_ink_drv.__getattr__ = _ink_drv_getattr
sys.path.insert(0, '/home/pi/Inkycal/inkycal/display/drivers')
sys.path.insert(0, '/home/pi/Projects/calm-care-display')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

try:
    import requests
except ImportError:
    logger.error("requests library not found")
    sys.exit(1)

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    logger.error("Pillow (PIL) not found")
    sys.exit(1)

# --- Constants ---
WIDTH = 800
HEIGHT = 480
PADDING = 32
BORDER_WIDTH = 2
COLUMN_GAP = 24

FONT_DIR = '/home/pi/Inkycal/fonts/NotoSans'
FONT_REGULAR = os.path.join(FONT_DIR, 'NotoSans-SemiCondensed.ttf')
FONT_MEDIUM = os.path.join(FONT_DIR, 'NotoSans-SemiCondensedMedium.ttf')
FONT_BOLD = os.path.join(FONT_DIR, 'NotoSans-SemiCondensedSemiBold.ttf')

# Cached EPD instance — created once per process to avoid GPIO conflicts
_epd = None


# --- Config & API ---

def load_config():
    config_path = '/home/pi/Projects/calm-care-display/config.json'
    if not os.path.exists(config_path):
        raise FileNotFoundError(
            "Config file not found at %s. Create it with backendUrl, "
            "deviceId, and deviceKey." % config_path
        )
    with open(config_path, 'r') as f:
        return json.load(f)


def fetch_sync_data(config):
    url = "%s/pi/sync/%s" % (
        config['backendUrl'].rstrip('/'), config['deviceId']
    )
    headers = {'x-device-key': config['deviceKey']}
    logger.info("Fetching sync data from %s", url)
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()


def send_heartbeat(config):
    try:
        url = "%s/pi/sync/%s/heartbeat" % (
            config['backendUrl'].rstrip('/'), config['deviceId']
        )
        headers = {
            'x-device-key': config['deviceKey'],
            'Content-Type': 'application/json'
        }
        try:
            ip_address = socket.gethostbyname(socket.gethostname())
        except Exception:
            ip_address = "unknown"
        payload = {
            'ipAddress': ip_address,
            'firmwareVersion': '1.0.0',
            'powerSource': 'ac'
        }
        resp = requests.patch(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
        logger.info("Heartbeat sent successfully")
    except Exception as e:
        logger.warning("Heartbeat failed: %s", str(e))


# --- Rendering helpers ---

def _load_font(size, font_type='regular'):
    if font_type == 'medium':
        path = FONT_MEDIUM
    elif font_type == 'bold':
        path = FONT_BOLD
    else:
        path = FONT_REGULAR
    return ImageFont.truetype(path, size)


def _measure_text(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def _format_today():
    now = datetime.now()
    return now.strftime('%A, %B %-d')


def _format_med_time(scheduled_for):
    if not scheduled_for:
        return ""
    try:
        cleaned = scheduled_for[:19]
        dt = datetime.strptime(cleaned, '%Y-%m-%dT%H:%M:%S')
        return dt.strftime('%H:%M')
    except (ValueError, IndexError):
        return ""


def _draw_dashed_rect(draw, x, y, w, h):
    step = 8
    for sx in range(x, x + w, step * 2):
        ex = min(sx + step, x + w)
        draw.line([(sx, y), (ex, y)], fill=0, width=BORDER_WIDTH)
    for sx in range(x, x + w, step * 2):
        ex = min(sx + step, x + w)
        draw.line([(sx, y + h), (ex, y + h)], fill=0, width=BORDER_WIDTH)
    for sy in range(y, y + h, step * 2):
        ey = min(sy + step, y + h)
        draw.line([(x, sy), (x, ey)], fill=0, width=BORDER_WIDTH)
    for sy in range(y, y + h, step * 2):
        ey = min(sy + step, y + h)
        draw.line([(x + w, sy), (x + w, ey)], fill=0, width=BORDER_WIDTH)


def _determine_next_reminder(next_med, next_routine):
    """Return (show_medication, show_routine) for next_reminder template."""
    if next_med and next_routine:
        try:
            med_str = next_med.get('scheduledFor', '')
            if med_str:
                med_dt = datetime.strptime(med_str[:19], '%Y-%m-%dT%H:%M:%S')
                med_mins = med_dt.hour * 60 + med_dt.minute
            else:
                med_mins = 24 * 60
        except (ValueError, IndexError):
            med_mins = 24 * 60

        try:
            rt = next_routine.get('scheduledTime', '00:00')
            parts = rt.split(':')
            routine_mins = int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            routine_mins = 24 * 60

        return (med_mins <= routine_mins), (med_mins > routine_mins)
    elif next_med:
        return True, False
    elif next_routine:
        return False, True
    return False, False


# --- Layout rendering ---

def _render_header(draw, fonts, today_date, patient_name):
    left_x = PADDING
    right_x = WIDTH - PADDING

    label_h = _measure_text(draw, "TODAY", fonts['label'])[1]
    name_h = _measure_text(draw, today_date, fonts['header_name'])[1]

    draw.text((left_x, PADDING), "TODAY", fill=0, font=fonts['label'], anchor="lt")
    draw.text(
        (left_x, PADDING + label_h + 4),
        today_date, fill=0, font=fonts['header_name'], anchor="lt"
    )

    pat_label_w = _measure_text(draw, "PATIENT", fonts['label'])[0]
    draw.text(
        (right_x - pat_label_w, PADDING),
        "PATIENT", fill=0, font=fonts['label'], anchor="lt"
    )
    pat_name_w = _measure_text(draw, patient_name, fonts['header_name'])[0]
    draw.text(
        (right_x - pat_name_w, PADDING + label_h + 4),
        patient_name, fill=0, font=fonts['header_name'], anchor="lt"
    )

    line_y = PADDING + label_h + 4 + name_h + 8
    draw.line([(left_x, line_y), (right_x, line_y)], fill=0, width=BORDER_WIDTH)
    return line_y


def _render_daily_summary(draw, fonts, data, left_x, right_x, content_y, content_height):
    next_med = data.get('nextMedication')
    next_routine = data.get('nextRoutine')

    col_w = int((right_x - left_x - COLUMN_GAP) / 2)
    col_h = content_height

    # Left column: Medication
    med_x = left_x
    draw.rectangle((med_x, content_y, med_x + col_w, content_y + col_h), outline=0, width=BORDER_WIDTH)

    inner_x = med_x + 12
    inner_y = content_y + 12

    draw.text((inner_x, inner_y), "NEXT MEDICATION", fill=0, font=fonts['label'], anchor="lt")
    inner_y += _measure_text(draw, "NEXT MEDICATION", fonts['label'])[1] + 8

    if next_med is not None:
        med_time = _format_med_time(next_med.get('scheduledFor'))
        if med_time:
            draw.text((inner_x, inner_y), med_time, fill=0, font=fonts['time'], anchor="lt")
            inner_y += _measure_text(draw, med_time, fonts['time'])[1] + 6
        med_name = next_med.get('name', '')
        if med_name:
            draw.text((inner_x, inner_y), med_name, fill=0, font=fonts['title'], anchor="lt")
            inner_y += _measure_text(draw, med_name, fonts['title'])[1] + 4
        dose = next_med.get('dose', '')
        if dose:
            draw.text((inner_x, inner_y), dose, fill=0, font=fonts['body'], anchor="lt")
    else:
        muted = "No medications scheduled"
        mute_w, mute_h = _measure_text(draw, muted, fonts['body'])
        draw.text(
            (med_x + (col_w - mute_w) / 2, content_y + (col_h - mute_h) / 2),
            muted, fill=0, font=fonts['body'], anchor="lt"
        )

    # Right column: Routine
    routine_x = med_x + col_w + COLUMN_GAP
    draw.rectangle((routine_x, content_y, routine_x + col_w, content_y + col_h), outline=0, width=BORDER_WIDTH)

    inner_x2 = routine_x + 12
    inner_y2 = content_y + 12

    draw.text((inner_x2, inner_y2), "NEXT ROUTINE", fill=0, font=fonts['label'], anchor="lt")
    inner_y2 += _measure_text(draw, "NEXT ROUTINE", fonts['label'])[1] + 8

    if next_routine is not None:
        rtime = next_routine.get('scheduledTime', '')
        if rtime:
            parts = rtime.split(':')
            formatted_time = "%s:%s" % (parts[0], parts[1]) if len(parts) >= 2 else rtime
            draw.text((inner_x2, inner_y2), formatted_time, fill=0, font=fonts['time'], anchor="lt")
            inner_y2 += _measure_text(draw, formatted_time, fonts['time'])[1] + 6
        r_title = next_routine.get('title', '')
        if r_title:
            draw.text((inner_x2, inner_y2), r_title, fill=0, font=fonts['title'], anchor="lt")
            inner_y2 += _measure_text(draw, r_title, fonts['title'])[1] + 4
        category = next_routine.get('category', '')
        if category:
            draw.text((inner_x2, inner_y2), category.capitalize(), fill=0, font=fonts['body'], anchor="lt")
    else:
        muted = "No routines scheduled"
        mute_w, mute_h = _measure_text(draw, muted, fonts['body'])
        draw.text(
            (routine_x + (col_w - mute_w) / 2, content_y + (col_h - mute_h) / 2),
            muted, fill=0, font=fonts['body'], anchor="lt"
        )


def _render_next_reminder(draw, fonts, data, left_x, right_x, content_y, content_height):
    next_med = data.get('nextMedication')
    next_routine = data.get('nextRoutine')
    show_med, show_routine = _determine_next_reminder(next_med, next_routine)

    cx = (left_x + right_x) / 2
    box_w = right_x - left_x
    pad = 16

    if show_med and next_med:
        label_text = "NEXT MEDICATION REMINDER"
        label_h = _measure_text(draw, label_text, fonts['label'])[1]
        med_time = _format_med_time(next_med.get('scheduledFor'))
        time_h = _measure_text(draw, med_time, fonts['time'])[1] if med_time else 0
        name = next_med.get('name', '')
        name_h = _measure_text(draw, name, fonts['title'])[1] if name else 0
        dose = next_med.get('dose', '')
        dose_h = _measure_text(draw, dose, fonts['body'])[1] if dose else 0
        total_h = pad * 2 + label_h + 8 + time_h + (8 if med_time else 0) + name_h + (4 if name else 0) + dose_h
        box_y = content_y + max(10, (content_height - total_h) / 2)
        draw.rectangle([left_x, box_y, right_x, box_y + total_h], outline=0, width=BORDER_WIDTH)
        cy = box_y + pad
        lw = _measure_text(draw, label_text, fonts['label'])[0]
        draw.text((cx - lw / 2, cy), label_text, fill=0, font=fonts['label'], anchor="lt")
        cy += label_h + 8
        if med_time:
            tw = _measure_text(draw, med_time, fonts['time'])[0]
            draw.text((cx - tw / 2, cy), med_time, fill=0, font=fonts['time'], anchor="lt")
            cy += time_h + 8
        if name:
            nw = _measure_text(draw, name, fonts['title'])[0]
            draw.text((cx - nw / 2, cy), name, fill=0, font=fonts['title'], anchor="lt")
            cy += name_h + 4
        if dose:
            dw = _measure_text(draw, dose, fonts['body'])[0]
            draw.text((cx - dw / 2, cy), dose, fill=0, font=fonts['body'], anchor="lt")

    elif show_routine and next_routine:
        label_text = "NEXT ROUTINE ACTIVITY"
        label_h = _measure_text(draw, label_text, fonts['label'])[1]
        rtime = next_routine.get('scheduledTime', '')
        parts = rtime.split(':')
        formatted_time = "%s:%s" % (parts[0], parts[1]) if len(parts) >= 2 else rtime
        time_h = _measure_text(draw, formatted_time, fonts['time'])[1]
        r_title = next_routine.get('title', '')
        title_h = _measure_text(draw, r_title, fonts['title'])[1] if r_title else 0
        cat = next_routine.get('category', '').capitalize()
        cat_h = _measure_text(draw, cat, fonts['body'])[1] if cat else 0
        total_h = pad * 2 + label_h + 8 + time_h + 8 + title_h + (4 if r_title else 0) + cat_h
        box_y = content_y + max(10, (content_height - total_h) / 2)
        draw.rectangle([left_x, box_y, right_x, box_y + total_h], outline=0, width=BORDER_WIDTH)
        cy = box_y + pad
        lw = _measure_text(draw, label_text, fonts['label'])[0]
        draw.text((cx - lw / 2, cy), label_text, fill=0, font=fonts['label'], anchor="lt")
        cy += label_h + 8
        tw = _measure_text(draw, formatted_time, fonts['time'])[0]
        draw.text((cx - tw / 2, cy), formatted_time, fill=0, font=fonts['time'], anchor="lt")
        cy += time_h + 8
        if r_title:
            nw = _measure_text(draw, r_title, fonts['title'])[0]
            draw.text((cx - nw / 2, cy), r_title, fill=0, font=fonts['title'], anchor="lt")
            cy += title_h + 4
        if cat:
            cw = _measure_text(draw, cat, fonts['body'])[0]
            draw.text((cx - cw / 2, cy), cat, fill=0, font=fonts['body'], anchor="lt")

    else:
        msg = "No upcoming activities or medications scheduled today."
        msg_w, msg_h = _measure_text(draw, msg, fonts['body'])
        box_h = msg_h + pad * 2
        box_y = content_y + max(10, (content_height - box_h) / 2)
        _draw_dashed_rect(draw, left_x, box_y, box_w, box_h)
        draw.text(
            (left_x + (box_w - msg_w) / 2, box_y + pad),
            msg, fill=0, font=fonts['body'], anchor="lt"
        )


def _render_footer(draw, fonts, data):
    device = data.get('device', {})
    next_med = data.get('nextMedication')
    missed_dose = data.get('missedDose')

    left_x = PADDING
    right_x = WIDTH - PADDING
    content_w = right_x - left_x

    footer_font = fonts['footer']
    missed_font = fonts['missed']
    footer_h = _measure_text(draw, "Ag", footer_font)[1]

    has_missed_banner = bool(device.get('showMissedDoseAlerts', True) and missed_dose is not None)
    banner_h = 44 if has_missed_banner else 0

    footer_line_y = HEIGHT - PADDING - banner_h - (footer_h + 10)
    status_y = footer_line_y + 2 + 6
    banner_y = status_y + footer_h + 6

    draw.line([(left_x, footer_line_y), (right_x, footer_line_y)], fill=0, width=BORDER_WIDTH)

    status = "Awaiting schedule"
    if next_med is not None:
        status = "Awaiting confirmation"
    elif missed_dose is not None:
        status = "Missed dose !"
    draw.text((left_x, status_y), "Status: %s" % status, fill=0, font=footer_font, anchor="lt")

    sync_text = "Synced just now"
    sync_w = _measure_text(draw, sync_text, footer_font)[0]
    draw.text((right_x - sync_w, status_y), sync_text, fill=0, font=footer_font, anchor="lt")

    if has_missed_banner:
        missed_name = missed_dose.get('name', 'medication')
        missed_dose_str = missed_dose.get('dose', '')
        if missed_dose_str:
            banner_text = "! Please take %s %s as soon as possible" % (missed_name, missed_dose_str)
        else:
            banner_text = "! Please take %s as soon as possible" % missed_name
        banner_text_h = _measure_text(draw, banner_text, missed_font)[1]
        actual_banner_h = banner_text_h + 16
        draw.rectangle([left_x, banner_y, right_x, banner_y + actual_banner_h], fill=0)
        banner_text_w = _measure_text(draw, banner_text, missed_font)[0]
        draw.text(
            (left_x + (content_w - banner_text_w) / 2, banner_y + 8),
            banner_text, fill=1, font=missed_font, anchor="lt"
        )


def render_image(data):
    image = Image.new('1', (WIDTH, HEIGHT), 1)
    draw = ImageDraw.Draw(image)

    fonts = {
        'label':       _load_font(14),
        'body':        _load_font(22),
        'title':       _load_font(30, 'bold'),
        'time':        _load_font(56, 'bold'),
        'header_name': _load_font(26, 'bold'),
        'missed':      _load_font(20, 'medium'),
        'footer':      _load_font(18),
    }

    device = data.get('device', {})
    patient = data.get('patient', {})
    missed_dose = data.get('missedDose')

    patient_name = patient.get('name', '---') if patient else '---'
    today_date = _format_today()
    template = device.get('displayTemplate', 'daily_summary')

    left_x = PADDING
    right_x = WIDTH - PADDING

    header_line_y = _render_header(draw, fonts, today_date, patient_name)
    content_y = header_line_y + BORDER_WIDTH + 14

    footer_font_h = _measure_text(draw, "Ag", fonts['footer'])[1]
    has_missed_banner = bool(device.get('showMissedDoseAlerts', True) and missed_dose is not None)
    banner_h = 44 if has_missed_banner else 0
    footer_line_y = HEIGHT - PADDING - banner_h - (footer_font_h + 10)
    content_height = max(100, footer_line_y - 12 - content_y)

    if template == 'next_reminder':
        _render_next_reminder(draw, fonts, data, left_x, right_x, content_y, content_height)
    else:
        _render_daily_summary(draw, fonts, data, left_x, right_x, content_y, content_height)

    _render_footer(draw, fonts, data)

    return image


# --- Display ---

_epd = None


def get_epd():
    global _epd

    if _epd is None:
        logger.info("Loading EPD driver")

        # Release any GPIO pins held by a previous crash
        try:
            import RPi.GPIO as GPIO
            GPIO.setwarnings(False)
            GPIO.cleanup()
        except Exception:
            pass

        logger.info("Loading epdconfig")

        _spec = importlib.util.spec_from_file_location(
            "epdconfig",
            _DRIVERS + "/epdconfig.py"
        )
        _mod = importlib.util.module_from_spec(_spec)
        sys.modules['epdconfig'] = _mod
        _spec.loader.exec_module(_mod)

        logger.info("Loading epd_7_in_5_v2")

        _spec2 = importlib.util.spec_from_file_location(
            "epd_7_in_5_v2",
            _DRIVERS + "/epd_7_in_5_v2.py"
        )
        _mod2 = importlib.util.module_from_spec(_spec2)
        sys.modules['epd_7_in_5_v2'] = _mod2
        _spec2.loader.exec_module(_mod2)

        logger.info("Creating EPD instance")

        _epd = _mod2.EPD()

        # Patch ReadBusy with a safe timeout to prevent infinite loops if hardware fails
        def _read_busy_with_timeout(self_epd):
            import RPi.GPIO as GPIO
            import time
            start = time.time()
            while GPIO.input(self_epd.busy_pin) == 1:
                if time.time() - start > 10.0:
                    raise TimeoutError("e-Paper Busy Timeout (10s exceeded)")
                time.sleep(0.1)

        _mod2.EPD.ReadBusy = _read_busy_with_timeout

        logger.info("EPD driver instance created")

    return _epd


def push_to_display(image):
    global _epd

    try:
        epd = get_epd()

        logger.info("About to call epd.init()")
        epd.init()
        logger.info("epd.init() finished")

        logger.info("About to call getbuffer()")

        buffer = epd.getbuffer(image)

        logger.info("getbuffer() finished")

        logger.info("About to call display()")

        epd.display(buffer)

        logger.info("display() finished")

        logger.info("About to call sleep()")

        epd.sleep()

        logger.info("sleep() finished")

        logger.info("Display updated successfully")

    except Exception as e:
        logger.exception("Display update failed")

        try:
            if _epd is not None:
                _epd.sleep()
        except Exception:
            pass

        _epd = None

# --- Main loop ---

def main():
    config = load_config()
    logger.info("CareCircle display starting. Device: %s", config['deviceId'])

    while True:
        try:
            data = fetch_sync_data(config)
            refresh_minutes = 1  # Forced to 1 minute as requested by user (original: data.get('device', {}).get('refreshMinutes', 15))
            image = render_image(data)
            push_to_display(image)
            send_heartbeat(config)
            logger.info("Cycle complete. Sleeping %d minute(s).", refresh_minutes)
        except Exception as e:
            logger.error("Cycle failed: %s", str(e))
            refresh_minutes = 1

        time.sleep(refresh_minutes * 60)


if __name__ == '__main__':
    main()
