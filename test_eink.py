import os
import sys
import time

# Añadimos la carpeta 'lib' de Waveshare al PATH de Python
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

# 1. Importa el driver correspondiente a tu modelo exacto
try:
    from waveshare_epd import epd7in5_V2 as epd_driver
except ImportError:
    print("Error: Asegúrate de haber copiado la carpeta 'lib' del repositorio de Waveshare.")
    sys.exit(1)

from PIL import Image, ImageDraw, ImageFont

try:
    print("Inicializando la pantalla E-Ink...")
    epd = epd_driver.EPD()
    epd.init()
    
    print("Limpiando la pantalla...")
    epd.Clear() # Esto pintará la pantalla de blanco

    print("Dibujando interfaz de prueba...")
    # Crea una imagen binaria en blanco (1 bit por píxel) con las dimensiones de la pantalla
    image = Image.new('1', (epd.width, epd.height), 255) # 255 = Blanco
    draw = ImageDraw.Draw(image)
    
    # Dibujamos textos e indicadores
    draw.text((20, 20), "CareCircle AI", fill=0) # 0 = Negro
    draw.text((20, 50), "Dispositivo Raspberry Pi 3: Conectado", fill=0)
    draw.line((20, 80, 300, 80), fill=0)

    print("Enviando la imagen a la pantalla...")
    epd.display(epd.getbuffer(image))

    print("Poniendo pantalla en modo reposo (Sleep)...")
    epd.sleep()
    print("¡Prueba realizada con éxito!")

except KeyboardInterrupt:
    print("Prueba cancelada por el usuario.")
    epd_driver.epdconfig.module_exit()
    sys.exit()
