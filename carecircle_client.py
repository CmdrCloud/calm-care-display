import os
import sys
import time
import socket
import requests
from datetime import datetime

# Añadir la carpeta lib de Waveshare al PATH de Python
sys.path.append(os.path.join(os.path.dirname(__file__), 'lib'))

# 1. IMPORTA TU DRIVER EXACTO (Cambia 'epd7in5_V2' según tu modelo identificado en el paso anterior)
try:
    from waveshare_epd import epd7in5_V2 as epd_driver
except ImportError:
    print("Error: No se encontró la carpeta 'lib' de Waveshare.")
    sys.exit(1)

from PIL import Image, ImageDraw, ImageFont

# 2. CONFIGURACIÓN DEL DISPOSITIVO
# Reemplaza con la dirección IP de tu servidor backend de CareCircle y los datos de tu dispositivo
BACKEND_URL = "https://prueba.sisganadero.online/api"  # link del backend Fastify
DEVICE_ID = "481632d6-9160-43b7-80df-dc4c6e2df29a" # UUID generado en la base de datos/consola
DEVICE_KEY = "cmgjr7LJGmOsSsklLjYTwPs8leh5WVVZ"   # Clave en texto plano usada para x-device-key
REFRESH_INTERVAL = 300 # Segundos entre actualizaciones (5 minutos)

def get_ip_address():
    """Obtiene la dirección IP local de la Raspberry Pi"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def fetch_data():
    """Obtiene los datos de la interfaz del backend de CareCircle"""
    url = f"{BACKEND_URL}/pi/sync/{DEVICE_ID}"
    headers = {"x-device-key": DEVICE_KEY}
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()

def send_heartbeat():
    """Envía telemetría de la Raspberry Pi al backend"""
    url = f"{BACKEND_URL}/pi/sync/{DEVICE_ID}/heartbeat"
    headers = {"x-device-key": DEVICE_KEY}
    payload = {
        "ipAddress": get_ip_address(),
        "firmwareVersion": "1.0.0",
        "batteryPercentage": 100, # Cambiar si tienes un hardware de lectura de batería
        "powerSource": "ac"
    }
    try:
        requests.patch(url, json=payload, headers=headers, timeout=5)
        print("Heartbeat enviado con éxito.")
    except Exception as e:
        print(f"Error al enviar heartbeat: {e}")

def get_font(size, bold=False):
    """Intenta cargar fuentes del sistema y si no, carga la por defecto"""
    font_names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for font_path in font_names:
        if os.path.exists(font_path):
            return ImageFont.truetype(font_path, size)
    return ImageFont.load_default()

def render_interface(data, width, height):
    """Dibuja la interfaz usando Pillow basándose en el JSON del backend"""
    # Crear lienzo en blanco (255 = Blanco en e-ink)
    img = Image.new('1', (width, height), 255)
    draw = ImageDraw.Draw(img)

    patient_name = data.get("patient", {}).get("name", "Sin Paciente") if data.get("patient") else "—"
    today_str = datetime.now().strftime("%A, %d de %B").capitalize()
    
    # Fuentes
    font_title = get_font(22, bold=True)
    font_subtitle = get_font(12, bold=False)
    font_bold = get_font(18, bold=True)
    font_regular = get_font(14, bold=False)
    font_tiny = get_font(10, bold=False)

    # 1. ENCABEZADO
    draw.text((20, 15), "HOY", fill=0, font=font_subtitle)
    draw.text((20, 30), today_str, fill=0, font=font_title)
    
    draw.text((width - 150, 15), "PACIENTE", fill=0, font=font_subtitle)
    draw.text((width - 150, 30), patient_name, fill=0, font=font_title)
    
    # Línea divisoria del encabezado
    draw.line((20, 65, width - 20, 65), fill=0, width=2)

    # 2. CONTENIDO PRINCIPAL (Medicación vs Rutina)
    device_config = data.get("device", {})
    show_med = device_config.get("showNextMedication", True)
    show_routine = device_config.get("showNextRoutine", True)
    template = device_config.get("displayTemplate", "daily_summary")

    next_med = data.get("nextMedication")
    next_rot = data.get("nextRoutine")
    missed_dose = data.get("missedDose")

    content_top = 80
    content_height = height - 160  # Margen para el pie de página
    col_width = (width - 60) // 2

    if template == "next_reminder":
        # Diseño de recordatorio único gigante (centrado)
        # Determinar cuál es más próximo (Medicación o Rutina)
        is_med_next = True
        if next_med and next_rot:
            # Simulación simple de comparación horaria
            is_med_next = True # O procesar strings de hora para comparar
        elif not next_med and next_rot:
            is_med_next = False

        box_left = 50
        box_width = width - 100
        draw.rectangle((box_left, content_top, box_left + box_width, content_top + content_height), outline=0, width=2)
        
        if is_med_next and next_med:
            # Mostrar la próxima medicación en grande
            # Parsear fecha de programación para mostrar hora
            med_time = next_med.get("scheduledFor", "")
            try:
                time_obj = datetime.fromisoformat(med_time.replace("Z", "+00:00"))
                time_str = time_obj.strftime("%H:%M")
            except:
                time_str = "--:--"

            draw.text((box_left + 20, content_top + 15), "PRÓXIMO MEDICAMENTO", fill=0, font=font_subtitle)
            draw.text((box_left + 20, content_top + 35), time_str, fill=0, font=get_font(40, bold=True))
            draw.text((box_left + 20, content_top + 85), next_med.get("name", ""), fill=0, font=font_bold)
            draw.text((box_left + 20, content_top + 110), f"Dosis: {next_med.get('dose', '')}", fill=0, font=font_regular)
        elif next_rot:
            # Mostrar la próxima rutina
            draw.text((box_left + 20, content_top + 15), "PRÓXIMA RUTINA", fill=0, font=font_subtitle)
            draw.text((box_left + 20, content_top + 35), next_rot.get("scheduledTime", ""), fill=0, font=get_font(40, bold=True))
            draw.text((box_left + 20, content_top + 85), next_rot.get("title", ""), fill=0, font=font_bold)
            draw.text((box_left + 20, content_top + 110), f"Categoría: {next_rot.get('category', '')}", fill=0, font=font_regular)
        else:
            draw.text((box_left + 20, content_top + 40), "No hay actividades próximas hoy.", fill=0, font=font_regular)

    else:
        # Diseño en columnas (Medicación a la izquierda, Rutina a la derecha)
        # Columna Izquierda: Medicamentos
        if show_med:
            draw.rectangle((20, content_top, 20 + col_width, content_top + content_height), outline=0, width=2)
            draw.text((35, content_top + 15), "SIGUIENTE MEDICAMENTO", fill=0, font=font_tiny)
            if next_med:
                med_time = next_med.get("scheduledFor", "")
                try:
                    time_obj = datetime.fromisoformat(med_time.replace("Z", "+00:00"))
                    time_str = time_obj.strftime("%H:%M")
                except:
                    time_str = "--:--"
                draw.text((35, content_top + 35), time_str, fill=0, font=get_font(28, bold=True))
                draw.text((35, content_top + 70), next_med.get("name", ""), fill=0, font=font_bold)
                draw.text((35, content_top + 95), f"Dosis: {next_med.get('dose', '')}", fill=0, font=font_regular)
            else:
                draw.text((35, content_top + 50), "Sin medicamentos", fill=0, font=font_regular)
        else:
            # Dibujar caja discontinua de bloqueado
            draw.rectangle((20, content_top, 20 + col_width, content_top + content_height), outline=0, width=1)
            draw.text((35, content_top + 50), "Medicación oculta", fill=0, font=font_regular)

        # Columna Derecha: Rutinas
        if show_routine:
            draw.rectangle((width - col_width - 20, content_top, width - 20, content_top + content_height), outline=0, width=2)
            draw.text((width - col_width - 5, content_top + 15), "SIGUIENTE RUTINA", fill=0, font=font_tiny)
            if next_rot:
                draw.text((width - col_width - 5, content_top + 35), next_rot.get("scheduledTime", ""), fill=0, font=get_font(28, bold=True))
                draw.text((width - col_width - 5, content_top + 70), next_rot.get("title", ""), fill=0, font=font_bold)
                draw.text((width - col_width - 5, content_top + 95), f"Frecuencia: {next_rot.get('priority', '').capitalize()}", fill=0, font=font_regular)
            else:
                draw.text((width - col_width - 5, content_top + 50), "Sin rutinas", fill=0, font=font_regular)
        else:
            draw.rectangle((width - col_width - 20, content_top, width - 20, content_top + content_height), outline=0, width=1)
            draw.text((width - col_width - 5, content_top + 50), "Rutina oculta", fill=0, font=font_regular)

    # 3. PIE DE PÁGINA Y MENSAJE DE ALERTA
    footer_y = height - 60
    draw.line((20, footer_y, width - 20, footer_y), fill=0, width=2)
    
    # Texto de Estado
    status_text = "Esperando planificaciones"
    if next_med:
        status_raw = next_med.get("status", "pending")
        if status_raw == "confirmed":
            status_text = "Confirmado ✓"
        elif status_raw == "missed":
            status_text = "¡Dosis Omitida!"
        else:
            status_text = "Esperando confirmación"
            
    draw.text((20, footer_y + 15), f"Estado: {status_text}", fill=0, font=font_regular)
    
    # Info de Sincronización
    ip_info = f"IP: {get_ip_address()}"
    draw.text((width - 150, footer_y + 15), ip_info, fill=0, font=font_tiny)

    # 4. ALERTA DE DOSIS OMITIDA (Mensaje Banner en Negro)
    if device_config.get("showMissedDoseAlerts", True) and missed_dose:
        banner_height = 40
        # Dibujar un rectángulo negro en la parte inferior para que resalte
        draw.rectangle((20, height - 105, width - 20, height - 105 + banner_height), fill=0)
        alert_msg = f"! Omitida: Tomar {missed_dose.get('name')} ({missed_dose.get('dose')}) urgente"
        # Dibujar texto en blanco (255)
        draw.text((30, height - 95), alert_msg, fill=255, font=font_regular)

    return img

def main():
    print("Iniciando servicio de pantalla CareCircle...")
    
    # Inicializar pantalla una sola vez
    epd = epd_driver.EPD()
    epd.init()
    
    # Limpieza inicial
    print("Limpiando pantalla...")
    epd.Clear()
    
    while True:
        try:
            print("Consultando servidor...")
            data = fetch_data()
            
            print("Renderizando interfaz en imagen...")
            img = render_interface(data, epd.width, epd.height)
            
            print("Actualizando pantalla E-Ink...")
            epd.init()  # Despierta la pantalla si estaba en sleep
            epd.display(epd.getbuffer(img))
            epd.sleep() # Poner en sleep para no gastar batería y proteger el panel
            
            # Enviar telemetría de confirmación
            send_heartbeat()
            
        except Exception as e:
            print(f"Error durante el ciclo: {e}")
            
        # Dormir hasta el siguiente ciclo
        print(f"Esperando {REFRESH_INTERVAL} segundos para la siguiente sincronización...")
        time.sleep(REFRESH_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Servicio detenido manualmente.")
        epd_driver.epdconfig.module_exit()
        sys.exit()
