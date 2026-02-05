import json
import time
import csv
from playwright.sync_api import sync_playwright

def scrape_properties():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://buydepa.com/propiedades", wait_until="networkidle")
        
        # Esperar a que las tarjetas carguen
        page.wait_for_selector("div:has-text('UF')", timeout=10000)
        
        all_properties = {}
        
        # Función para extraer datos de la página actual
        def extract_data():
            return page.evaluate("""() => {
                const allDivs = document.querySelectorAll('div');
                const potentialCards = Array.from(allDivs).filter(d => 
                    d.innerText.includes('UF') && 
                    d.innerText.includes('m²') && 
                    d.innerText.length < 500 && 
                    d.querySelector('img')
                );

                const results = [];
                potentialCards.forEach(card => {
                    const text = card.innerText;
                    const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
                    
                    const priceMatch = text.match(/([\\d.,]+)\\s*UF/);
                    const areaMatch = text.match(/([\\d.,]+)\\s*m²/);
                    const roomsMatch = text.match(/(\\d+)D/);
                    const bathsMatch = text.match(/(\\d+)B/);
                    
                    let address = "No encontrada";
                    const priceIdx = lines.findIndex(l => l.includes('UF'));
                    if (priceIdx !== -1 && lines[priceIdx + 1]) {
                        address = lines[priceIdx + 1];
                    }

                    if (priceMatch && address !== "No encontrada") {
                        results.push({
                            price: priceMatch[1],
                            address: address,
                            rooms: roomsMatch ? roomsMatch[1] : "0",
                            baths: bathsMatch ? bathsMatch[1] : "0",
                            area: areaMatch ? areaMatch[1] : "0",
                            image: card.querySelector('img')?.src,
                            status: lines[0]
                        });
                    }
                });
                return results;
            }""")

        # Identificar el contenedor de scroll
        scroll_container_selector = ".flex-1.overflow-y-auto.bg-background"
        
        # Scroll y recolección
        last_count = 0
        retries = 0
        while retries < 5:
            props = extract_data()
            for p in props:
                key = f"{p['address']}-{p['price']}"
                all_properties[key] = p
            
            current_count = len(all_properties)
            print(f"Propiedades recolectadas: {current_count}")
            
            if current_count == last_count:
                retries += 1
            else:
                retries = 0
            
            last_count = current_count
            
            # Scroll down
            page.evaluate(f"document.querySelector('{scroll_container_selector}').scrollBy(0, 1000)")
            time.sleep(1)
            
            if current_count > 100: # Límite razonable para el MVP
                break

        browser.close()
        return list(all_properties.values())

if __name__ == "__main__":
    data = scrape_properties()
    
    # Guardar como JSON
    with open("properties.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Guardar como CSV
    if data:
        keys = data[0].keys()
        with open("properties.csv", "w", newline="", encoding="utf-8") as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(data)
    
    print(f"Proceso completado. {len(data)} propiedades guardadas.")