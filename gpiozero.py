#!/usr/bin/env python3
"""Minimal gpiozero compatibility shim for this project.

This file shadows the installed gpiozero package only for the CareCircle
project so the legacy Inkycal epdconfig driver can keep using
`gpiozero.LED(...)` and `gpiozero.Button(...)` without gpiozero's global
pin-reservation registry getting in the way.
"""

from __future__ import annotations

import threading
from typing import Optional

try:
    import RPi.GPIO as GPIO
except Exception as exc:  # pragma: no cover
    raise RuntimeError("RPi.GPIO is required for the local gpiozero shim") from exc

GPIO.setwarnings(False)
try:
    GPIO.setmode(GPIO.BCM)
except Exception:
    # If another part of the process already set a mode, keep going.
    pass

_LOCK = threading.RLock()


def _setup_output(pin: int, initial: int = 0) -> None:
    with _LOCK:
        try:
            GPIO.setup(pin, GPIO.OUT, initial=GPIO.HIGH if initial else GPIO.LOW)
        except RuntimeError:
            # If the pin was already configured in this process, reuse it.
            pass


def _setup_input(pin: int, pull_up: bool = False) -> None:
    with _LOCK:
        pud = GPIO.PUD_UP if pull_up else GPIO.PUD_DOWN
        try:
            GPIO.setup(pin, GPIO.IN, pull_up_down=pud)
        except RuntimeError:
            pass


class LED:
    def __init__(self, pin: int, active_high: bool = True, initial_value: bool = False):
        self.pin = int(pin)
        self.active_high = bool(active_high)
        self._closed = False
        self._lock = threading.RLock()
        _setup_output(self.pin, 1 if initial_value else 0)
        if initial_value:
            self.on()
        else:
            self.off()

    def on(self) -> None:
        with self._lock:
            if self._closed:
                return
            GPIO.output(self.pin, GPIO.HIGH if self.active_high else GPIO.LOW)

    def off(self) -> None:
        with self._lock:
            if self._closed:
                return
            GPIO.output(self.pin, GPIO.LOW if self.active_high else GPIO.HIGH)

    def toggle(self) -> None:
        with self._lock:
            if self.is_active:
                self.off()
            else:
                self.on()

    @property
    def value(self) -> bool:
        return bool(GPIO.input(self.pin)) if self.active_high else not bool(GPIO.input(self.pin))

    @value.setter
    def value(self, state: bool) -> None:
        self.on() if state else self.off()

    @property
    def is_active(self) -> bool:
        return self.value

    def close(self) -> None:
        with self._lock:
            self._closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass

    def __repr__(self) -> str:
        return f"<gpiozero.LED object on pin GPIO{self.pin}, active_high={self.active_high}, is_active={self.is_active}>"


class Button:
    def __init__(self, pin: int, pull_up: bool = True, bounce_time: Optional[float] = None):
        self.pin = int(pin)
        self.pull_up = bool(pull_up)
        self.bounce_time = bounce_time
        self._closed = False
        _setup_input(self.pin, pull_up=self.pull_up)

    @property
    def value(self) -> bool:
        return bool(GPIO.input(self.pin))

    @property
    def is_pressed(self) -> bool:
        return self.value

    def close(self) -> None:
        self._closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass

    def __repr__(self) -> str:
        return f"<gpiozero.Button object on pin GPIO{self.pin}, pull_up={self.pull_up}, is_pressed={self.is_pressed}>"


__all__ = ["LED", "Button"]

