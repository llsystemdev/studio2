# export_virtus_catalog.py

"""
Script para extraer automáticamente el catálogo completo de Virtus Car Rental
y generar un JSON listo para importar en Firebase Firestore.
Requisitos:
    pip install requests beautifulsoup4
Uso:
    python export_virtus_catalog.py
Salida:
    virtus_full_catalog.json en el directorio actual.
"""

import requests
from bs4 import BeautifulSoup
import json
import xml.etree.ElementTree as ET

# URL del sitemap de vehículos
SITEMAP_URL = "https://www.virtuscarrentalsrl.com/pixad-autos-sitemap.xml"

def get_vehicle_urls_from_sitemap(sitemap_url):
    """Descarga y parsea el sitemap para extraer las URLs de los vehículos."""
    urls = []
    try:
        resp = requests.get(sitemap_url)
        resp.raise_for_status()
        
        # Parsear el XML del sitemap
        root = ET.fromstring(resp.content)
        # El namespace es importante para encontrar los elementos correctamente
        namespace = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_element in root.findall('s:url', namespace):
            loc_element = url_element.find('s:loc', namespace)
            if loc_element is not None:
                urls.append(loc_element.text)
        print(f"✔ Se encontraron {len(urls)} URLs en el sitemap.")
    except requests.exceptions.RequestException as e:
        print(f"Error al descargar el sitemap: {e}")
    except ET.ParseError as e:
        print(f"Error al parsear el XML del sitemap: {e}")
    return urls

# Obtener URLs del sitemap
urls = get_vehicle_urls_from_sitemap(SITEMAP_URL)

catalog = {}

if not urls:
    print("No se pudieron obtener las URLs. Abortando script.")
else:
    for url in urls:
        try:
            resp = requests.get(url)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            
            # Extraer ID limpio
            vehicle_id = url.rstrip("/").split("/")[-1]
            
            # Extraer título
            title_elem = soup.find("h1")
            nombre = title_elem.text.strip() if title_elem else vehicle_id.replace("-", " ").title()
            
            # Extraer imagen destacada
            img_elem = soup.find("img", class_="wp-post-image")
            imagen = img_elem["src"] if img_elem and img_elem.get("src") else ""
            
            # Extraer descripción (primer <p> dentro de .entry-content)
            desc_elem = soup.select_one(".entry-content p")
            descripcion = desc_elem.text.strip() if desc_elem else ""
            
            # Extraer precio (span con clase 'precio' o 'price')
            price_elem = soup.find("span", class_="precio") or soup.find("span", class_="price")
            precio_text = price_elem.text.strip().replace("$", "").replace(",", "") if price_elem else ""
            precio_por_dia = float(precio_text) if precio_text.replace(".", "", 1).isdigit() else None
            
            # Categoría genérica (a ajustar manualmente si es necesario)
            categoria = "Vehículo"
            
            catalog[vehicle_id] = {
                "nombre": nombre,
                "imagen": imagen,
                "categoria": categoria,
                "precioPorDia": precio_por_dia,
                "descripcion": descripcion
            }
            print(f"Procesado: {nombre}")

        except requests.exceptions.RequestException as e:
            print(f"Error al procesar la URL {url}: {e}")
        except Exception as e:
            print(f"Ocurrió un error inesperado con la URL {url}: {e}")

    # Guardar resultado en JSON
    output_path = "virtus_full_catalog.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"vehicles": catalog}, f, indent=4, ensure_ascii=False)

    print(f"✔ Catálogo completo generado: {output_path}")
```