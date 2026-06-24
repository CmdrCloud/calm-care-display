#!/usr/bin/env python3
"""
CareCircle E-Ink Diagnostic Script
Helps debug connection/hang issues with Waveshare 7.5" V2 display and Raspberry Pi.
"""
import sys
import os
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger("EInkDiagnostic")

DRIVERS_PATH = '/home/pi/Inkycal/inkycal/display/drivers'
sys.path.insert(0, DRIVERS_PATH)
sys.path.insert(0, '/home/pi/Projects/calm-care-display')

logger.info("Starting diagnostic check...")

# 1. Verificar importación de dependencias RPi.GPIO y spidev
try:
    import RPi.GPIO as GPIO
    import spidev
    logger.info("SUCCESS: RPi.GPIO and spidev libraries imported successfully.")
except ImportError as e:
    logger.error(f"FAILURE: Missing python dependencies: {e}")
    logger.error("Run: pip3 install RPi.GPIO spidev")
    sys.exit(1)

# 2. Verificar existencia de los drivers de Inkycal
if not os.path.exists(DRIVERS_PATH):
    logger.error(f"FAILURE: Inkycal drivers directory not found at: {DRIVERS_PATH}")
    logger.error("Please verify Inkycal installation path.")
    sys.exit(1)

driver_file = os.path.join(DRIVERS_PATH, 'epd_7_in_5_v2.py')
if not os.path.exists(driver_file):
    logger.error(f"FAILURE: Display driver not found at: {driver_file}")
    sys.exit(1)
logger.info(f"SUCCESS: Drivers found at {DRIVERS_PATH}")

# 3. Cargar dinámicamente epdconfig y epd_7_in_5_v2
import importlib.util
try:
    spec_cfg = importlib.util.spec_from_file_location("epdconfig", DRIVERS_PATH + "/epdconfig.py")
    epdconfig = importlib.util.module_from_spec(spec_cfg)
    sys.modules['epdconfig'] = epdconfig
    spec_cfg.loader.exec_module(epdconfig)
    logger.info("SUCCESS: epdconfig module loaded successfully.")
except Exception as e:
    logger.error(f"FAILURE: Failed to load epdconfig: {e}")
    sys.exit(1)

try:
    spec_epd = importlib.util.spec_from_file_location("epd_7_in_5_v2", DRIVERS_PATH + "/epd_7_in_5_v2.py")
    epd_mod = importlib.util.module_from_spec(spec_epd)
    sys.modules['epd_7_in_5_v2'] = epd_mod
    spec_epd.loader.exec_module(epd_mod)
    logger.info("SUCCESS: epd_7_in_5_v2 module loaded successfully.")
except Exception as e:
    logger.error(f"FAILURE: Failed to load epd_7_in_5_v2: {e}")
    sys.exit(1)

# 4. Intentar inicializar modulo de bajo nivel (SPI / GPIO setup)
logger.info("Attempting low-level GPIO/SPI initialization (module_init)...")
try:
    epdconfig.module_init()
    logger.info("SUCCESS: epdconfig.module_init() completed without errors.")
except Exception as e:
    logger.error(f"FAILURE: module_init failed: {e}")
    logger.error("This usually means SPI is disabled in raspi-config or there is a GPIO conflict.")
    sys.exit(1)

# 5. Crear la instancia de EPD y parchear ReadBusy con un Timeout seguro
logger.info("Creating EPD instance...")
try:
    epd = epd_mod.EPD()
    logger.info("SUCCESS: EPD instance created.")
except Exception as e:
    logger.error(f"FAILURE: Failed to create EPD instance: {e}")
    GPIO.cleanup()
    sys.exit(1)

# Parcheamos el método ReadBusy para incluir un timeout de 8 segundos y mostrar info
def ReadBusyWithTimeout(self):
    logger.info("Waiting for e-Paper BUSY pin release...")
    timeout = 8.0  # 8 segundos de límite
    start_time = time.time()
    busy_pin = self.busy_pin
    
    # Leemos el estado inicial
    initial_state = GPIO.input(busy_pin)
    logger.info(f"Initial BUSY pin state: {initial_state} (GPIO {busy_pin})")
    
    # En la versión 7.5 V2, BUSY es 1 cuando está ocupada (ocupado transmitiendo/refrescando)
    # y 0 cuando está lista. Por tanto, espera a que sea 0.
    # Nota: Si el pin está desconectado y tiene un pull-down, leerá 0 inmediatamente.
    # Si tiene un pull-up o lee ruido, podría quedarse atascado.
    while GPIO.input(busy_pin) == 1:
        if time.time() - start_time > timeout:
            logger.error("FAILURE: TIMEOUT waiting for BUSY pin to go LOW (0).")
            logger.error("The display is stuck or not responding. Check connections and power source.")
            raise TimeoutError("e-Paper Busy Timeout")
        time.sleep(0.1)
        
    logger.info(f"SUCCESS: BUSY pin released. Current state: {GPIO.input(busy_pin)}")

# Reemplazar la función original en el objeto epd
epd_mod.EPD.ReadBusy = ReadBusyWithTimeout
logger.info("Safely patched ReadBusy with an 8-second timeout.")

# 6. Ejecutar EPD.init()
try:
    logger.info("Calling epd.init()...")
    epd.init()
    logger.info("SUCCESS: epd.init() finished successfully! The display is connected and responding.")
    
    logger.info("Clearing display...")
    epd.Clear()
    
    logger.info("Putting display to sleep...")
    epd.sleep()
    logger.info("Diagnostic completed successfully: Connection verified!")
except Exception as e:
    logger.error(f"FAILURE: Error during display execution: {e}")
finally:
    logger.info("Cleaning up GPIO resources...")
    GPIO.cleanup()
