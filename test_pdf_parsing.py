import pdfplumber
import re

def test_pdf_parsing():
    pdf = pdfplumber.open('Plant Therapy _ NTS G.R.O.W GG.pdf')
    text = pdf.pages[0].extract_text()
    lines = text.split('\n')
    
    print("=== PDF PARSING ANALYSIS ===")
    print(f"Total lines: {len(lines)}")
    print(f"Text length: {len(text)} characters")
    
    # Find nutrient lines - expanded to include all 15 nutrients
    nutrient_lines = []
    for line in lines:
        if any(n in line.lower() for n in ['nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium', 
                                          'sulfur', 'sulphur', 'sodium', 'copper', 'zinc', 'manganese', 
                                          'iron', 'boron', 'molybdenum', 'silicon', 'cobalt']):
            nutrient_lines.append(line.strip())
    
    print(f"\nFound {len(nutrient_lines)} nutrient lines:")
    for line in nutrient_lines:
        print(f"  {line}")
    
    # Test parsing each nutrient line
    print("\n=== PARSING TEST ===")
    parsed_nutrients = []
    
    for line in nutrient_lines:
        # Match pattern: "N - Nitrogen 1.61 % 3.5 - 5.5 %"
        # Also handle "N/A" ranges and "<" values
        match = re.match(r'([A-Za-z\s-]+)\s+([<\d\.]+)\s*(ppm|%)?\s*([\d\.\s-]+|N/A)?', line)
        if match:
            name = match.group(1).strip()
            current = match.group(2)
            unit = match.group(3) or ('%' if '%' in line else 'ppm')
            ideal_range = match.group(4)
            
            # Parse ideal range to get midpoint
            ideal = None
            if ideal_range and ideal_range != 'N/A':
                range_match = re.search(r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)', ideal_range)
                if range_match:
                    low = float(range_match.group(1))
                    high = float(range_match.group(2))
                    ideal = (low + high) / 2
            
            # Handle '<' values
            if current.startswith('<'):
                current = '0'
            
            current_val = float(current) if current != '0' else 0
            
            nutrient_data = {
                'name': name,
                'current': current_val,
                'ideal': ideal,
                'unit': unit,
                'raw_line': line
            }
            parsed_nutrients.append(nutrient_data)
            print(f"✓ Parsed: {name} = {current_val} {unit}, ideal: {ideal}")
        else:
            print(f"✗ Failed to parse: {line}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Successfully parsed {len(parsed_nutrients)} nutrients")
    
    # Check if we have all 15 plant nutrients
    plant_nutrients = [
        'N - Nitrogen', 'P - Phosphorus', 'K - Potassium', 'S - Sulphur', 
        'Ca - Calcium', 'Mg - Magnesium', 'Na - Sodium', 'Cu - Copper', 
        'Zn - Zinc', 'Mn - Manganese', 'Fe - Iron', 'B - Boron', 
        'Mo - Molybdenum', 'Si - Silicon', 'Co - Cobalt'
    ]
    
    found_nutrients = [n['name'] for n in parsed_nutrients]
    missing = [n for n in plant_nutrients if n not in found_nutrients]
    
    print(f"Plant nutrients found: {len([n for n in plant_nutrients if n in found_nutrients])}/{len(plant_nutrients)}")
    if missing:
        print(f"Missing: {missing}")
    else:
        print("✓ All 15 plant nutrients found!")
    
    # Show all parsed nutrients
    print(f"\n=== ALL PARSED NUTRIENTS ===")
    for nutrient in parsed_nutrients:
        print(f"{nutrient['name']}: {nutrient['current']} {nutrient['unit']} (ideal: {nutrient['ideal']})")
    
    return parsed_nutrients

if __name__ == "__main__":
    test_pdf_parsing() 