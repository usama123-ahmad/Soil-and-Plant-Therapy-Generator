from flask import Flask, request, jsonify
import pdfplumber
import os
import traceback
from pdf2image import convert_from_bytes
import pytesseract
from PIL import Image
from flask_cors import CORS
import re
import difflib
from openai import OpenAI
from dotenv import load_dotenv
import urllib.request
import urllib.parse
import json

load_dotenv()

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

client = None
if OPENAI_API_KEY:
    try:
        # Temporarily unset ALL proxy-related environment variables to avoid conflicts
        original_proxy_vars = {}
        proxy_keys = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY', 'http_proxy', 'https_proxy', 'no_proxy']
        for key in proxy_keys:
            if key in os.environ:
                original_proxy_vars[key] = os.environ[key]
                del os.environ[key]
        
        # Also unset any other proxy-related variables
        for key in list(os.environ.keys()):
            if 'proxy' in key.lower():
                original_proxy_vars[key] = os.environ[key]
                del os.environ[key]
        
        # Create client with explicit httpx client to avoid proxy issues
        import httpx
        http_client = httpx.Client(
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
        
        # Create client with explicit parameters only
        client = OpenAI(api_key=OPENAI_API_KEY, http_client=http_client)
        
        # Restore proxy environment variables
        for key, value in original_proxy_vars.items():
            os.environ[key] = value
            
    except Exception as e:
        print(f"Warning: Could not initialize OpenAI client: {e}")
        client = None
else:
    print("WARNING: OPENAI_API_KEY environment variable not set. AI features will be disabled.")

app = Flask(__name__)
CORS(app)


def extract_tables_with_pdfplumber(file):
    tables = []
    with pdfplumber.open(file) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_tables = page.extract_tables()
            app.logger.info(f'Page {page_num + 1}: Found {len(page_tables)} tables')
            for t_idx, table in enumerate(page_tables):
                tables.append(table)
                app.logger.info(f'Table {t_idx + 1} (first 3 rows): {table[:3]}')
    return tables


def extract_text_with_ocr(file):
    images = convert_from_bytes(file.read())
    all_lines = []
    for idx, image in enumerate(images):
        text = pytesseract.image_to_string(image)
        app.logger.info(f'OCR Page {idx + 1} text (first 300 chars): {text[:300]}')
        lines = text.splitlines()
        all_lines.extend(lines)
    return all_lines


def parse_range(val):
    # Extract numbers from a string like "99 - 124 ppm" and return the midpoint
    nums = re.findall(r'\d+\.?\d*', val)
    if len(nums) == 2:
        return (float(nums[0]) + float(nums[1])) / 2
    elif len(nums) == 1:
        return float(nums[0])
    return None


# List of known nutrient names for matching
KNOWN_NUTRIENTS = [
    'Nitrate',
    'Ammonium',
    'Phosphorus',
    'Potassium',
    'Calcium',
    'Magnesium',
    'Sodium',
    'Sulphur',
    'Iron',
    'Copper',
    'Manganese',
    'Boron',
    'Zinc',
    'Cobalt',
    'Molybdenum',
    'Silica',
    'Aluminium',
    'Aluminum',
    'Ca/Mg Ratio',
    'Ca/K',
    'Mg/K',
    'K/Na',
    'P/Zn',
    'Fe/Mn',
    'Organic Matter',
    'Organic Carbon',
    'Conductivity',
    'Paramagnetism',
    'Base Saturation',
    'Other Bases',
    'Silicon',
    'Do (Hot CaCl2)',
    'jum (Mehlich II!)',
    'ium (Mehlich Ill)']

# Expanded custom mapping for common garbled OCR nutrient names
GARBLED_NUTRIENT_MAP = {
    'jum (Mehlich II!)': 'Calcium',
    # Also used for Potassium, will handle below
    'ium (Mehlich Ill)': 'Magnesium',
    'Do (Hot CaCl2)': 'Sodium',
    'Silicon (CaCl2)': 'Silicon',
    '(KCl)': 'Potassium',
    # Add more mappings as needed based on OCR output
}

# Ordered list of expected nutrients (update as needed for your report)
ORDERED_NUTRIENTS = [
    'Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Phosphorus', 'Sulphur',
    'Iron', 'Copper', 'Manganese', 'Boron', 'Zinc', 'Cobalt', 'Molybdenum', 'Silica', 'Aluminium',
    # Add more if your report has more nutrients in a fixed order
]

# Nutrient order and mapping based on the provided soil report image
NUTRIENT_IMAGE_ORDER = [
    'Paramagnetism',
    'pH-level (1:5 water)',
    'Organic Matter (Calc)',
    'Organic Carbon (LECO)',
    'Conductivity (1:5 water)',
    'Ca/Mg Ratio',
    'Nitrate-N (KCl)',
    'Ammonium-N (KCl)',
    'Phosphorus (Mehlich III)',
    'Calcium (Mehlich III)',
    'Magnesium (Mehlich III)',
    'Potassium (Mehlich III)',
    'Sodium (Mehlich III)',
    'Sulfur (KCl)',
    'Aluminium',
    'Silicon (CaCl2)',
    'Boron (Hot CaCl2)',
    'Iron (DTPA)',
    'Manganese (DTPA)',
    'Copper (DTPA)',
    'Zinc (DTPA)'
]


def extract_nutrients_from_text(text):
    import re
    # Only include lines that start with a valid nutrient code (strict match)
    nutrient_prefixes = [
        'N -', 'P -', 'K -', 'S -', 'Ca -', 'Mg -', 'Na -', 'Cu -', 'Zn -',
        'Mn -', 'Fe -', 'B -', 'Mo -', 'Si -', 'Co -'
    ]
    # Build a regex pattern for valid nutrient lines
    prefix_pattern = r'^(N|P|K|S|Ca|Mg|Na|Cu|Zn|Mn|Fe|B|Mo|Si|Co)\s-\s'
    lines = text.split('\n')
    nutrient_lines = []
    for line in lines:
        if re.match(prefix_pattern, line.strip()):
            nutrient_lines.append(line)
    nutrients = []
    for line in nutrient_lines:
        # Match pattern: "N - Nitrogen 1.61 % 3.5 - 5.5 %"
        match = re.match(
            r'([A-Za-z\s-]+)\s+([<\d\.]+)\s*(ppm|%)?\s*([\d\.\s-]+|N/A)?', line)
        if match:
            name = match.group(1).strip()
            # Only accept if name starts with a valid prefix
            if not any(name.startswith(prefix)
                       for prefix in nutrient_prefixes):
                continue
            current = match.group(2)
            unit = match.group(3) or ('%' if '%' in line else 'ppm')
            ideal_range = match.group(4)
            # Parse ideal range to get midpoint
            ideal = None
            if ideal_range and ideal_range != 'N/A':
                range_match = re.search(
                    r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)', ideal_range)
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
                'unit': unit
            }
            nutrients.append(nutrient_data)
    return nutrients

import pdfplumber
import re
from collections import defaultdict

def extract_nutrient_overview(pdf_path):

    # Keys for the 7 nutrient points
    nutrient_keys = [
        "Organic Matter",
        "CEC",
        "Soil pH",
        "Base Saturation",
        "Available Nutrients",
        "Lamotte Reams",
        "TAE",
        "Phosphorus Monitoring"
    ]
    def find_matching_keys(text, keys):
        """Return a list of keys found in the given text string."""
        found_keys = [key for key in keys if key.lower() in text.lower()]
        return found_keys
    
    # Combine all PDF pages into one text string
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"

    # Regex to capture lines like: "PADDOCK: <Any name>"
    paddock_pattern = r"PADDOCK:\s*(.+)"

    # Find all positions of paddock names
    paddock_positions = []
    for match in re.finditer(paddock_pattern, full_text):
        paddock_positions.append((match.start(), match.group(1).strip()))

    # Split the text at every "Nutrient Status Overview:"
    nutrient_sections = []
    for match in re.finditer(r"Nutrient Status Overview:", full_text):
        nutrient_sections.append(match.start())

    results = defaultdict(list)

    # Process each Nutrient Status Overview section
    for i, start_pos in enumerate(nutrient_sections):
        end_pos = nutrient_sections[i + 1] if i + 1 < len(nutrient_sections) else len(full_text)
        section_text = full_text[start_pos:end_pos]

        # 🔹 Stop processing at "Soil TherapyTM" and remove it
        section_text = re.split(r"Soil TherapyTM", section_text)[0]

        # Find the paddock whose position is just before this section
        paddock_name = "UNKNOWN"
        for pos, name in paddock_positions:
            if pos < start_pos:
                paddock_name = name
            else:
                break

        # Extract 7 numbered points using regex
        points_pattern = r"(\d\.\s.*?)(?=\d\.|\Z)"
        points = re.findall(points_pattern, section_text, re.DOTALL)

        # Clean and store
        cleaned_points = [p.strip() for p in points]
        # Map to the fixed keys dynamically
        overview = {}

        for point in cleaned_points:
            # Split the point into key and description
            splited_point = point.split(':', 1)  # Split only at the first colon
            if len(splited_point) > 1:
                first = splited_point[0].strip()
                text = splited_point[1].strip()

                # Check if any key matches the first part
                matches = find_matching_keys(first, nutrient_keys)
                if matches:
                    # If multiple keys match, add all of them
                    for match in matches:
                        text = str(text).replace("\n"," ")
                        text = re.split(r"Soil Therapy TM", text)[0]
                        overview[match] = text

        # Correctly update results
        if paddock_name not in results:
            results[paddock_name] = {}

        results[paddock_name].update(overview)

    return results

@app.route('/extract-soil-report', methods=['POST'])
def extract_soil_report():
    try:
        if 'file' not in request.files:
            app.logger.error('No file uploaded')
            return jsonify({'error': 'No file uploaded'}), 400
        file = request.files['file']
        app.logger.info(f'Received file: {file.filename}')
        file.seek(0)
        tables = extract_tables_with_pdfplumber(file)
        app.logger.info(f'Extracted {len(tables)} tables from PDF')
        for idx, table in enumerate(tables):
            app.logger.info(f'Table {idx + 1} has {len(table)} rows')
        file.seek(0)
        
        # Store all found analyses
        all_analyses = []
        analysis_id = 0
        
        # Try to extract nutrients from tables (text-based PDF)
        if tables:
            for table_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue
                
                first_row = table[0]
                if len(first_row)<4: 
                    continue

                # Find header row and map columns
                header_row = None
                header_idx = 0
                is_tae_table = False
                for i, row in enumerate(table):
                        
                    if any(cell and isinstance(cell, str)
                           and 'ELEMENT' in cell.upper() for cell in row):
                        header_row = row
                        header_idx = i
                        app.logger.info(f'Element table detected! Row: {row}')
                        break
                    # Check if this is a TAE table
                    for cell in row:
                        if cell and isinstance(cell, str):
                            if 'T.A.E.' in cell.upper() or 'T.A.E' in cell.upper():
                                is_tae_table = True
                                header_row = row
                                header_idx = i
                                app.logger.info(f'TAE table detected! Row: {row}')
                                break
                    if is_tae_table:
                        break
                        
                if header_row:
                    header_map = {}
                    for idx, cell in enumerate(header_row):
                        if not cell:
                            continue
                        cell_l = cell.strip().lower()
                        if 'element' in cell_l or 'category' in cell_l:
                            header_map['name'] = idx
                        elif 'your level' in cell_l or 'level' in cell_l:
                            header_map['current'] = idx
                        elif 'acceptable range' in cell_l or 'range' in cell_l:
                            header_map['ideal'] = idx
                        elif 'unit' in cell_l:
                            header_map['unit'] = idx
                            
                    app.logger.info(f'Detected header row: {header_row}')
                    app.logger.info(f'Header mapping: {header_map}')
                    
                    # Parse data rows
                    nutrients = []
                    for row in table[header_idx + 1:]:
                        if not row or len(row) < 2:
                            continue
                        # Extract the range string as shown in the PDF
                        range_str = row[header_map['ideal']].strip(
                        ) if 'ideal' in header_map and row[header_map['ideal']] else None
                        # Parse the value as before

                        def parse_value(val):
                            if not val:
                                return 0
                            val_clean = re.sub(
                                r'\s*(ppm|%|mg/kg|mS/cm)', '', val)
                            if '<' in val_clean:
                                return 0
                            # Extract the first number from the string
                            match = re.search(r'[-+]?\d*\.\d+|\d+', val_clean)
                            if match:
                                return float(match.group())
                            return 0
                        current = parse_value(
                            row[header_map['current']]) if 'current' in header_map else None
                        # For compatibility, keep 'ideal' as the midpoint if
                        # possible
                        ideal = None
                        if range_str and '-' in range_str:
                            try:
                                parts = [float(re.sub(r'[^0-9.]+', '', p))
                                         for p in range_str.split('-')]
                                if len(parts) == 2:
                                    ideal = sum(parts) / 2
                            except Exception:
                                ideal = None
                        nutrient_row = {
                            'name': row[header_map['name']].strip() if 'name' in header_map and row[header_map['name']] else '',
                            'current': current,
                            'ideal': ideal,
                            'unit': '',
                            'range': range_str,
                            'category': 'tae' if is_tae_table else None
                        }
                        if is_tae_table:
                            app.logger.info(f'TAE nutrient created: {nutrient_row}')
                        # Try to extract unit from current value
                        if row[header_map['current']
                               ] and '%' in row[header_map['current']]:
                            nutrient_row['unit'] = '%'
                        elif row[header_map['current']] and 'ppm' in row[header_map['current']]:
                            nutrient_row['unit'] = 'ppm'
                        nutrients.append(nutrient_row)
                        
                    # If we found valid nutrients, add this as an analysis
                    if nutrients:
                        # Try to extract analysis info from the table
                        analysis_info = extract_analysis_info(tables, table_idx)
                        all_analyses.append({
                            'id': analysis_id,
                            'nutrients': nutrients,
                            'info': analysis_info
                        })
                        analysis_id += 1
                        
                else:
                    # Fallback: try to extract from all rows with at least 2
                    # columns
                    app.logger.warning(
                        'No header row detected, using fallback extraction for this table.')
                    nutrients = []
                    for row in table:
                        if not row or len(row) < 2:
                            continue
                        name = row[0].strip() if row[0] else ''
                        current_raw = row[1].strip() if row[1] else ''
                        ideal_raw = row[2].strip() if len(
                            row) > 2 and row[2] else ''
                        # Skip empty names and header rows
                        if not name or 'ELEMENT' in name or 'CATEGORY' in name:
                            continue
                        unit = ''
                        if 'ppm' in current_raw or 'ppm' in ideal_raw:
                            unit = 'ppm'
                        elif '%' in current_raw or '%' in ideal_raw:
                            unit = '%'

                        def parse_value(val):
                            if not val:
                                return 0
                            # Remove unit from value
                            val_clean = re.sub(
                                r'\s*(ppm|%|mg/kg|mS/cm)', '', val)
                            if '<' in val_clean:
                                return 0
                            # Extract the first number from the string
                            match = re.search(r'[-+]?\d*\.\d+|\d+', val_clean)
                            if match:
                                return float(match.group())
                            return 0
                        current = parse_value(current_raw)
                        ideal = parse_range(ideal_raw)
                        
                        # Check if this table contains TAE data by looking at the table content FIRST
                        is_tae_table = False
                        for table_row in table:
                            for cell in table_row:
                                if cell and isinstance(cell, str):
                                    if 'T.A.E.' in cell.upper() or 'T.A.E' in cell.upper():
                                        is_tae_table = True
                                        app.logger.info(f'TAE table detected in fallback! Row: {table_row}')
                                        break
                            if is_tae_table:
                                break
                        
                        # PATCH: Always include base saturation nutrients with % unit, even if ideal is missing
                        # BUT only if this is NOT a TAE table
                        base_sat_names = ['Calcium', 'Magnesium', 'Potassium', 'Sodium', 'Aluminum', 'Hydrogen', 'Other Bases']
                        if name in base_sat_names and unit == '%' and not is_tae_table:
                            nutrient_row = {
                                'name': name,
                                'current': current,
                                'ideal': ideal if ideal is not None else None,
                                'unit': unit
                            }
                            app.logger.info(
                                f'Base saturation PATCH: {nutrient_row}')
                            nutrients.append(nutrient_row)
                            continue
                        elif name in base_sat_names and unit == '%' and is_tae_table:
                            app.logger.info(f'Skipping base saturation logic for TAE nutrient: {name} (unit: {unit})')
                        # Only add if we have a valid name and some data
                        if name and (current > 0 or ideal is not None):
                            nutrient_row = {
                                'name': name,
                                'current': current,
                                'ideal': ideal,
                                'unit': unit,
                                'category': 'tae' if is_tae_table else None
                            }
                            if is_tae_table:
                                app.logger.info(f'TAE nutrient being added: {nutrient_row}')
                            else:
                                app.logger.info(f'Fallback parsed nutrient row: {nutrient_row}')
                            nutrients.append(nutrient_row)
                            
                    # If we found valid nutrients, add this as an analysis
                    if nutrients:
                        analysis_info = extract_analysis_info(tables, table_idx)
                        all_analyses.append({
                            'id': analysis_id,
                            'nutrients': nutrients,
                            'info': analysis_info
                        })
                        analysis_id += 1

        # If no tables found, try OCR
        if not all_analyses:
            app.logger.warning('No tables found with pdfplumber, trying OCR...')
            file.seek(0)
            ocr_lines = extract_text_with_ocr(file)
            app.logger.info(
                "Original OCR lines for debug:\n" +
                "\n".join(ocr_lines))
            ocr_text = '\n'.join(ocr_lines)
            nutrients_by_image_order = extract_nutrients_from_text(ocr_text)
            if nutrients_by_image_order:
                app.logger.info(
                    f'Final nutrients array (by image order): {nutrients_by_image_order}')
                all_analyses.append({
                    'id': 0,
                    'nutrients': nutrients_by_image_order,
                    'info': {'name': 'OCR Analysis', 'page': 1}
                })

        # Return all analyses found
        if all_analyses:
            app.logger.info(f'Found {len(all_analyses)} analyses in PDF')

            # Build LaMotte/Reams candidates and deterministic selection from ALL analyses
            import re as _re
            flat_nutrients = []
            for a in all_analyses:
                flat_nutrients.extend(a.get('nutrients', []))

            def _base_name(nm: str) -> str:
                if not isinstance(nm, str):
                    return ''
                nm_clean = nm.strip()
                nm_clean = _re.split(r"\s*\(", nm_clean)[0].strip()
                low = nm_clean.lower()
                if low.startswith('calcium'):
                    return 'Calcium'
                if low.startswith('magnesium'):
                    return 'Magnesium'
                if low.startswith('phosphorus'):
                    return 'Phosphorus'
                if low.startswith('potassium'):
                    return 'Potassium'
                return nm_clean

            def _norm_num(val):
                try:
                    if isinstance(val, (int, float)):
                        return float(val)
                    if isinstance(val, str):
                        m = _re.search(r"-?\d*\.?\d+", val.replace(',', ''))
                        return float(m.group()) if m else float('nan')
                except Exception:
                    return float('nan')
                return float('nan')

            def _approx(a, b, tol=0.6):
                try:
                    return abs(float(a) - float(b)) <= tol
                except Exception:
                    return False

            # Candidates: Ca/Mg/K/P ppm rows, exclude Mehlich and explicit TAE category
            lamotte_candidates = []
            for n in flat_nutrients:
                name = n.get('name', '') or ''
                unit = (n.get('unit') or '').lower()
                cat = n.get('category')
                if unit != 'ppm':
                    continue
                if '(mehlich' in name.lower():
                    continue
                if cat == 'tae':
                    continue
                b = _base_name(name)
                if b in ['Calcium', 'Magnesium', 'Phosphorus', 'Potassium']:
                    lamotte_candidates.append({
                        'name': b,
                        'current': n.get('current'),
                        'ideal': n.get('ideal'),
                        'unit': n.get('unit'),
                        'raw_name': name,
                        'category': cat,
                    })

            # Deterministic selection by ideal values; fallback to ordinal occurrences if needed
            ideals = {'Phosphorus': 18.5, 'Calcium': 1500.0, 'Magnesium': 212.5, 'Potassium': 90.0}
            selected_map = {}
            for elem, target in ideals.items():
                hits = [c for c in lamotte_candidates if c['name'] == elem and _approx(_norm_num(c.get('ideal')), target, 0.6)]
                if hits:
                    selected_map[elem] = hits[0]
                else:
                    # ordinal fallback from flat order
                    occ = [n for n in flat_nutrients if _base_name(n.get('name', '')) == elem and (n.get('unit') or '').lower() == 'ppm']
                    idx = 1 if elem == 'Phosphorus' else 2
                    sel = occ[idx] if len(occ) > idx else (occ[-1] if occ else None)
                    if sel:
                        selected_map[elem] = {
                            'name': elem,
                            'current': sel.get('current'),
                            'ideal': sel.get('ideal'),
                            'unit': sel.get('unit'),
                            'raw_name': sel.get('name'),
                            'category': sel.get('category'),
                        }

            lamotte_payload = {
                'candidates': lamotte_candidates,
                'selected': [selected_map.get('Phosphorus'), selected_map.get('Calcium'), selected_map.get('Magnesium'), selected_map.get('Potassium')]
            }

            nutrient_overview = extract_nutrient_overview(file)
            return jsonify({
                'analyses': all_analyses,
                'count': len(all_analyses),
                'lamotte': lamotte_payload,
                "nutrient_overview": nutrient_overview
            })

        app.logger.warning(
            'No nutrients extracted from PDF (neither tables nor OCR).')
        return jsonify(
            {'error': 'No nutrients extracted from PDF (neither tables nor OCR).'}), 400
    except Exception as e:
        app.logger.error('Exception during PDF extraction: ' + str(e))
        traceback.print_exc()
        return jsonify(
            {'error': 'Exception during PDF extraction', 'details': str(e)}), 500


def extract_analysis_info(tables, table_idx):
    """Extract analysis information from all tables up to and including the current one (to catch header metadata)"""
    import re
    from datetime import datetime
    info = {
        'name': f'Analysis {table_idx + 1}',
        'page': table_idx + 1,
        'crop': 'Unknown',
        'location': 'Unknown',
        'date': 'Unknown',
        'paddock': 'Unknown'
    }
    date_pattern = re.compile(r"\d{2}/\d{2}/\d{4}")
    
    # First, try to extract from the table immediately before the nutrient table
    if table_idx > 0:
        prev_table = tables[table_idx - 1]
        if 3 <= len(prev_table) <= 4:
            rows = [row[0] if row and isinstance(row[0], str) else '' for row in prev_table]
            rows = [r.strip() for r in rows if r and r.strip()]
            if len(rows) >= 2:
                # First row: crop
                if not date_pattern.match(rows[0]):
                    info['crop'] = rows[0]
                # Second row: paddock (if not a date and not a known crop)
                if len(rows) > 1 and info['paddock'] == "Unknown":
                    if not date_pattern.match(rows[1]) and rows[1] != info['crop']:
                        info['paddock'] = rows[1]
                # Third row: date
                if len(rows) > 2:
                    if date_pattern.match(rows[2]):
                        info['date'] = rows[2]
    
    # Scan all tables from the start up to and including the current table for any missing info
    for idx in range(0, table_idx + 1):
        if idx < 0 or idx >= len(tables):
            continue
        table = tables[idx]
        # Heuristic: If table has 2-4 rows, try to extract missing info
        if 3 <= len(table) <= 4:
            rows = [row[0] if row and isinstance(row[0], str) else '' for row in table]
            rows = [r.strip() for r in rows if r and r.strip()]
            if len(rows) >= 2:
                # First row: crop (if not already found)
                if info['crop'] == 'Unknown' and not date_pattern.match(rows[0]):
                    info['crop'] = rows[0]
                # Second row: paddock (if not already found and not a date and not a known crop)
                if info['paddock'] == 'Unknown' and len(rows) > 1:
                    if not date_pattern.match(rows[1]) and rows[1] != info['crop']:
                        info['paddock'] = rows[1]
                # Third row: date (if not already found)
                if info['date'] == 'Unknown' and len(rows) > 2:
                    if date_pattern.match(rows[2]):
                        info['date'] = rows[2]
        # Also check for explicit PADDOCK: lines as fallback
        for row in table:
            if not row:
                continue
            row_text = ' '.join([str(cell) for cell in row if cell])
            paddock_match = re.search(r"PADDOCK:?\s*([\w\-\s]+)", row_text, re.IGNORECASE)
            if paddock_match:
                paddock_val = paddock_match.group(1).strip()
                if paddock_val:
                    info['paddock'] = paddock_val
                    print(f"Extracted paddock (explicit): {info['paddock']} from row: {row_text}")
            # Crop
            if info['crop'] == 'Unknown':
                crop_match = re.search(r"CROP:?\s*([\w\-\s]+)", row_text, re.IGNORECASE)
                if crop_match:
                    crop_val = crop_match.group(1).strip()
                    if crop_val:
                        info['crop'] = crop_val
            # Date
            if info['date'] == 'Unknown':
                date_match = date_pattern.search(row_text)
                if date_match:
                    info['date'] = date_match.group(0)
            # Location
            if info['location'] == 'Unknown':
                loc_match = re.search(r"LOCATION:?\s*([\w\-\s]+)", row_text, re.IGNORECASE)
                if loc_match:
                    loc_val = loc_match.group(1).strip()
                    if loc_val:
                        info['location'] = loc_val
    print(f"Final extracted info for analysis {table_idx + 1}: {info}")
    return info


@app.route('/generate-comments', methods=['POST'])
def generate_comments():
    try:
        if not client:
            return jsonify({'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'}), 500
            
        data = request.get_json()
        deficient = data.get('deficient', [])
        optimal = data.get('optimal', [])
        excess = data.get('excess', [])

        # Enhanced prompt for more detailed and professional response
        prompt = f"""
As a professional plant nutritionist and agronomist, provide a BRIEF executive summary for a Plant Therapy Report based on the following nutrient analysis:

DEFICIENT NUTRIENTS: {', '.join(deficient) if deficient else 'None'}
OPTIMAL NUTRIENTS: {', '.join(optimal) if optimal else 'None'}
EXCESS NUTRIENTS: {', '.join(excess) if excess else 'None'}

Provide a complete executive summary (2-3 sentences) that gives a brief overview of the plant's nutritional status. Make sure to complete your thoughts and provide a full summary. Do NOT include detailed nutrient descriptions, specific functions, or management recommendations. Keep it brief and professional.

IMPORTANT: When mentioning nutrients, use the format "Full Name (Abbreviation)" - for example: Nitrogen (N), Phosphorus (P), Calcium (Ca), Magnesium (Mg), Potassium (K), Boron (B), Copper (Cu), Zinc (Zn), Iron (Fe), Manganese (Mn), Molybdenum (Mo), Sulphur (S), Sodium (Na).

Focus on:
- Brief overview of nutritional status
- Professional tone
- Complete sentences and thoughts
- No detailed nutrient analysis
- Use bold formatting for nutrient names
"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7
        )
        summary = response.choices[0].message.content.strip()

        # Remove any detailed nutrient descriptions that might still be generated
        import re
        # Remove any text that contains detailed nutrient descriptions
        cleaned = re.sub(r"(Nitrogen is essential for.*?)(?=\n\n|\n[A-Z]|$)", "", summary, flags=re.DOTALL)
        cleaned = re.sub(r"(Phosphorus is necessary for.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(Calcium is vital for.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(Magnesium is a key component.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(Copper, Zinc, Iron, and Boron.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(The excess of.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(To address these deficiencies.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        cleaned = re.sub(r"(With proper management.*?)(?=\n\n|\n[A-Z]|$)", "", cleaned, flags=re.DOTALL)
        # Remove any extra blank lines
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return jsonify({'summary': cleaned.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/generate-soil-comments', methods=['POST'])
def generate_soil_comments():
    try:
        if not client:
            return jsonify({'error': 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'}), 500
            
        data = request.get_json()
        section = data.get('section', '')
        
        # Check if data is in statusCategories format (from frontend)
        status_categories = data.get('statusCategories', {})
        if status_categories:
            deficient = status_categories.get('deficient', [])
            marginallyDeficient = status_categories.get('marginallyDeficient', [])
            optimal = status_categories.get('optimal', [])
            marginallyExcessive = status_categories.get('marginallyExcessive', [])
            excess = status_categories.get('excess', [])
        else:
            # Fallback to direct format
            deficient = data.get('deficient', [])
            marginallyDeficient = data.get('marginallyDeficient', [])
            optimal = data.get('optimal', [])
            marginallyExcessive = data.get('marginallyExcessive', [])
            excess = data.get('excess', [])
            
        nutrients_data = data.get('nutrients', [])

        # Normalize and scope nutrients per section when needed
        nutrients_data_clean = nutrients_data

        # Short-circuit organic matter to a deterministic, single-category response
        if section == 'organicMatter':
            def _has_om(name_list):
                return any(isinstance(nm, str) and 'organic matter' in nm.lower() for nm in name_list or [])

            if _has_om(excess):
                category = 'Excessive'
                impact = ('Very high organic matter increases moisture retention and can promote nitrogen immobilization, ' \
                          'leading to slower mineral nitrogen release, cooler/wetter seedbeds, and reduced early vigor. ' \
                          'It may also elevate biological oxygen demand, limiting aeration and root respiration in fine-textured or compacted soils.')
                rec = ('Reduce additional organic inputs temporarily and prioritize mineral balance, structure, and aeration. ' \
                       'Use shallow strategic cultivation, controlled traffic, and, where appropriate, calcium sources (e.g., gypsum) to improve flocculation and infiltration. ' \
                       'Monitor mineral N supply closely during early growth stages and adjust starter programs accordingly.')
            elif _has_om(marginallyExcessive):
                category = 'Marginally excessive'
                impact = ('Slightly elevated organic matter enhances water-holding capacity but can marginally increase N tie-up in cool or wet conditions, ' \
                          'and may slow soil warming in early spring.')
                rec = ('Moderate fresh organic inputs, maintain residue cover without overloading, and balance with readily available nitrogen when conditions are cool. ' \
                       'Keep soil structure open through surface residue management and periodic calcium additions if sodicity/dispersion is present.')
            elif _has_om(optimal):
                category = 'Optimal'
                impact = ('Organic matter at optimal levels supports nutrient cycling, microbial activity, stable aggregation, and resilient water dynamics, ' \
                          'reducing compaction risk and improving root exploration and nutrient uptake.')
                rec = ('Maintain current practices: return residues, diversify rotations, include cover crops where feasible, and apply quality composts/manures at maintenance rates. ' \
                       'Avoid unnecessary tillage to preserve aggregates and biological habitat.')
            elif _has_om(marginallyDeficient):
                category = 'Marginally deficient'
                impact = ('Slightly low organic matter reduces cation exchange capacity and microbial activity, ' \
                          'lowering nutrient retention and shortening moisture availability between rain/irrigation events.')
                rec = ('Increase organic inputs using cover crops (legume/grass mixes), high-quality composts, and manures; ' \
                       'minimize disturbance and keep living roots in the system as much as possible to build carbon incrementally.')
            elif _has_om(deficient):
                category = 'Deficient'
                impact = ('Low organic matter severely limits nutrient holding capacity, aggregate stability, and water retention, ' \
                          'increasing susceptibility to crusting, compaction, drought stress, and nutrient loss.')
                rec = ('Adopt a multi-year rebuild plan: intensive cover-cropping (include legumes where N is needed), strategic manure/compost additions, residue retention, ' \
                       'and reduced tillage. Pair with balanced mineral nutrition to support biology and accelerate carbon accrual.')
            else:
                category = 'Unknown'
                impact = 'Insufficient data to assess organic matter status.'
                rec = 'Confirm measurements and targets to enable a clear recommendation.'

            intro = "Organic matter represents the decomposed plant and animal materials in the soil, critical for soil health and fertility."
            cat_sentence = (category.lower() if isinstance(category, str) else 'unclear')
            status_line = f"The levels are {cat_sentence}."
            return jsonify({'summary': f"{intro} {status_line} {impact} {rec}"})
        debug_lines_with_categories = None
        if section == 'availableNutrients':
            try:
                seen_keys = set()
                cleaned_list = []
                for n in nutrients_data:
                    # Exclude TAE nutrients from available nutrient analysis
                    if str(n.get('category', '')).lower() == 'tae':
                        continue
                    name = str(n.get('name', '')).strip()
                    # Normalize Aluminium spelling
                    if name.lower() in ['aluminum', 'aluminium']:
                        name = 'Aluminium'
                    # Build a dedupe key without extraction method tags and underscores
                    import re as _re
                    base_name = _re.sub(r"\s*\([^)]*\)", '', name).replace('_', ' ').strip().lower()
                    if base_name in seen_keys:
                        continue
                    n_copy = dict(n)
                    n_copy['name'] = name
                    cleaned_list.append(n_copy)
                    seen_keys.add(base_name)
                nutrients_data_clean = cleaned_list

                # Build category lookup using normalized names from provided classification arrays
                def _norm(nm: str) -> str:
                    nm = (nm or '').strip()
                    nm = _re.sub(r"\s*\([^)]*\)", '', nm)  # strip parenthetical tags
                    nm = nm.replace('_', ' ')  # unify underscores
                    if nm.lower() in ['aluminum', 'aluminium']:
                        nm = 'Aluminium'
                    return nm.strip().lower()

                cat_map = {}
                for nm in deficient:
                    cat_map[_norm(nm)] = 'Deficient'
                for nm in marginallyDeficient:
                    cat_map[_norm(nm)] = 'Marginally deficient'
                for nm in optimal:
                    cat_map[_norm(nm)] = 'Optimal'
                for nm in marginallyExcessive:
                    cat_map[_norm(nm)] = 'Marginally excessive'
                for nm in excess:
                    cat_map[_norm(nm)] = 'Excessive'

                # Build debug lines with categories
                debug_lines = []
                for n in nutrients_data_clean:
                    nm = n.get('name', 'Unknown')
                    key = _norm(nm)
                    category = cat_map.get(key, 'Unclassified')
                    debug_lines.append(f"- {nm}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')}) — Category: {category}")
                debug_lines_with_categories = "\n".join(debug_lines)
            except Exception:
                nutrients_data_clean = nutrients_data
        
        # Deterministic renderer for Available Nutrients to avoid LLM misclassification
        if section == 'availableNutrients':
            import re as _re
            def _clean_name(nm: str) -> str:
                if not nm:
                    return 'Unknown'
                base = nm.strip()
                # Preserve Nitrate-N and Ammonium-N labels exactly
                if base.lower().startswith('nitrate-n'):
                    return 'Nitrate-N'
                if base.lower().startswith('ammonium-n'):
                    return 'Ammonium-N'
                # Normalize Aluminum/Aluminium spelling
                if base.lower().startswith('aluminum') or base.lower().startswith('aluminium'):
                    return 'Aluminium'
                # Strip extraction tags like (Mehlich III), (DTPA), (KCl), (CaCl2)
                base = _re.sub(r"\s*\([^)]*\)", '', base)
                # Replace underscores with spaces
                base = base.replace('_', ' ').strip()
                return base

            def _sort(lst):
                return sorted(lst, key=lambda x: x.lower())

            def _fmt_list(lst):
                if not lst:
                    return ''
                if len(lst) == 1:
                    return lst[0]
                return ", ".join(lst[:-1]) + f" and {lst[-1]}"

            # Build normalized category lists from incoming status categories
            cat_inputs = {
                'Deficient': deficient or [],
                'Marginally deficient': marginallyDeficient or [],
                'Optimal': optimal or [],
                'Marginally excessive': marginallyExcessive or [],
                'Excessive': excess or [],
            }
            # Normalize, dedupe, and apply Aluminium rule (only mention in Excessive)
            cats_norm = {k: [] for k in cat_inputs}
            seen = set()
            for cat, items in cat_inputs.items():
                for nm in items:
                    clean = _clean_name(nm)
                    # Aluminium only if Excessive
                    if clean == 'Aluminium' and cat != 'Excessive':
                        continue
                    key = (clean, cat)
                    if key in seen:
                        continue
                    cats_norm[cat].append(clean)
                    seen.add(key)

            # Ensure no nutrient appears in more than one category (prefer stricter order: Excessive > Marginally excessive > Optimal > Marginally deficient > Deficient)
            precedence = ['Excessive', 'Marginally excessive', 'Optimal', 'Marginally deficient', 'Deficient']
            assigned = {}
            for cat in precedence:
                new_list = []
                for nm in cats_norm[cat]:
                    if nm not in assigned:
                        assigned[nm] = cat
                        new_list.append(nm)
                cats_norm[cat] = new_list

            # Sort each category alphabetically
            for cat in cats_norm:
                cats_norm[cat] = _sort(cats_norm[cat])

            # Narrative rendering mirroring TAE style
            sentences = []
            if cats_norm['Deficient'] or cats_norm['Marginally deficient']:
                segs = []
                if cats_norm['Deficient']:
                    segs.append(f"deficiencies in {_fmt_list(cats_norm['Deficient'])}")
                if cats_norm['Marginally deficient']:
                    segs.append(f"{'a marginal deficiency' if len(cats_norm['Marginally deficient'])==1 else 'marginal deficiencies'} in {_fmt_list(cats_norm['Marginally deficient'])}")
                if len(segs) == 2:
                    sentences.append(f"Currently, the soil analysis reveals {segs[0]}, while {segs[1]}.")
                else:
                    sentences.append(f"Currently, the soil analysis reveals {segs[0]}.")

            if cats_norm['Optimal']:
                sentences.append(f"Optimal levels are observed for {_fmt_list(cats_norm['Optimal'])}, supporting balanced nutrient availability.")

            if cats_norm['Marginally excessive'] or cats_norm['Excessive']:
                parts = []
                if cats_norm['Marginally excessive']:
                    parts.append(f"{'a marginal excess' if len(cats_norm['Marginally excessive'])==1 else 'marginal excesses'} in {_fmt_list(cats_norm['Marginally excessive'])}")
                if cats_norm['Excessive']:
                    parts.append(f"{'an excessive level' if len(cats_norm['Excessive'])==1 else 'excessive levels'} of {_fmt_list(cats_norm['Excessive'])}")
                if len(parts) == 2:
                    sentences.append(f"Additionally, {parts[0]}, whereas {parts[1]} may affect nutrient balance and crop performance.")
                else:
                    sentences.append(f"Additionally, {parts[0]} may affect nutrient balance and crop performance.")

            intro = "Available nutrients are the plant-available forms of essential nutrients that can be immediately taken up by plant roots, crucial for plant nutrition and growth."
            full = f"{intro} {' '.join(sentences)}".replace("  ", " ").strip()
            return jsonify({'summary': full})

        # Precompute selection for Lamotte/Reams by ordinal occurrence so the AI doesn't mis-pick
        selected_block = ""
        if section == 'lamotteReams':
            import re as _re
            def _base_name(nm: str) -> str:
                if not isinstance(nm, str):
                    return ''
                nm_clean = nm.replace('_', ' ').strip()
                nm_clean = _re.split(r"\s*\(", nm_clean)[0].strip()
                low = nm_clean.lower()
                if low.startswith('calcium'):
                    return 'Calcium'
                if low.startswith('magnesium'):
                    return 'Magnesium'
                if low.startswith('phosphorus'):
                    return 'Phosphorus'
                if low.startswith('potassium'):
                    return 'Potassium'
                return nm_clean
            # Gather occurrences in order of appearance
            occ = { 'Phosphorus': [], 'Calcium': [], 'Magnesium': [], 'Potassium': [] }
            for n in nutrients_data:
                b = _base_name(n.get('name', ''))
                if b in occ:
                    occ[b].append(n)
            def _fmt(n):
                if not n:
                    return 'N/A'
                cur = n.get('current', 'N/A')
                unit = n.get('unit', '')
                ideal = n.get('ideal', 'N/A')
                unit_sfx = f" {unit}" if unit else ''
                ideal_unit_sfx = f" {unit}" if unit else ''
                return f"{cur}{unit_sfx} (Ideal: {ideal}{ideal_unit_sfx})"
            selP = occ['Phosphorus'][1] if len(occ['Phosphorus']) >= 2 else (occ['Phosphorus'][-1] if occ['Phosphorus'] else None)
            selCa = occ['Calcium'][2] if len(occ['Calcium']) >= 3 else (occ['Calcium'][-1] if occ['Calcium'] else None)
            selMg = occ['Magnesium'][2] if len(occ['Magnesium']) >= 3 else (occ['Magnesium'][-1] if occ['Magnesium'] else None)
            selK = occ['Potassium'][2] if len(occ['Potassium']) >= 3 else (occ['Potassium'][-1] if occ['Potassium'] else None)
            selected_block = (
                f"SELECTED ENTRIES (use these exactly): "
                f"Phosphorus = {_fmt(selP)}; "
                f"Calcium = {_fmt(selCa)}; "
                f"Magnesium = {_fmt(selMg)}; "
                f"Potassium = {_fmt(selK)}."
            )
            print("DEBUG - Lamotte selected by ordinal:", selected_block)

        # Create section-specific prompts
        section_prompts = {
            'organicMatter': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's organic matter status for a Soil Therapy Report.

ORGANIC MATTER DATA: {', '.join([
    f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal Range: {n.get('ideal_range', [None, None])[0]}–{n.get('ideal_range', [None, None])[1]} {n.get('unit', '')})"
    if n.get('ideal_range') else
    f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')}"
    for n in nutrients_data if 'organic matter' in n.get('name', '').lower()
])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Focus ONLY on ORGANIC MATTER values, NOT organic carbon values
- Use percentage-based logic for organic matter status classification based on deviation from ideal values:
  * Deficient: More than 40% below the optimal ideal value
  * Marginally Deficient: Between 18% and 40% below the optimal ideal value  
  * Optimal: Between 18% below and 18% above the optimal ideal value
  * Marginally Excessive: Between 18% and 40% above the optimal ideal value
  * Excessive: Above 40% above the optimal ideal value
- IGNORE any target values - use only the ideal values
- NEVER mention "organic carbon" or "LECO" in your response - only discuss "organic matter"

CRITICAL: You MUST explicitly mention the nutrient status that exists. If the OPTIMAL list contains nutrients, mention them as "optimal". If the DEFICIENT list contains nutrients, mention them as "deficient". If the MARGINALLY DEFICIENT list contains nutrients, mention them as "marginally deficient". If the MARGINALLY EXCESSIVE list contains nutrients, mention them as "marginally excessive". If the EXCESS list contains nutrients, mention them as "excessive". Do NOT mention categories that are empty or say "no deficient nutrients" etc.

CRITICAL: NEVER mention the percentage thresholds (like "40% below", "18% above", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

IMPORTANT: Start your analysis by explaining what "organic matter" means, then describe the current organic matter status. If organic matter is deficient or marginally deficient, include ONE sentence with a recommendation to improve organic matter levels. Focus ONLY on describing the current organic matter levels and their implications.

List ALL specific nutrients in each category rather than using general terms. Write your response as ONE SINGLE PARAGRAPH, not multiple paragraphs.

Provide a 4-5 sentence analysis focusing on:
- Definition of organic matter and its significance for soil health and fertility
- Current organic matter levels across ALL categories (deficient, marginally deficient, optimal, marginally excessive, excessive) and their implications for nutrient availability, soil structure, and water retention
- One recommendation sentence if organic matter is deficient or marginally deficient

Use professional soil science terminology. Focus on describing the current situation only.
""",
            'cec': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's Cation Exchange Capacity (CEC) for a Soil Therapy Report.

CEC DATA: {', '.join([
    f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')}"
    for n in nutrients_data if 'cec' in n.get('name', '').lower() or 'cation exchange' in n.get('name', '').lower()
])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Focus ONLY on CEC (Cation Exchange Capacity) values.
- CEC is measured in cmol(+)/kg (equivalent to meq/100 g).
- Classify soil texture using the following reference table (strict):
  * Sand: 1–5 cmol(+)/kg — extremely low exchange sites, rapid leaching
  * Sandy Loam: 5–10 cmol(+)/kg — limited exchange sites, moderate leaching
  * Loam: 10–15 cmol(+)/kg — balanced texture and moderate CEC
  * Silt Loam: 15–25 cmol(+)/kg — higher CEC from fines and humus
  * Clay Loam: 20–30 cmol(+)/kg — elevated CEC due to clay minerals
  * Clay: 25–40+ cmol(+)/kg — high buffering and nutrient retention
  * Organic Soils / Peat: 40–100+ cmol(+)/kg — very high CEC from humus functional groups
- Overlap handling (e.g., 20–25 and 25–30): choose the category whose range midpoint is closest to the measured CEC; if exactly tied, prefer the finer-texture class (Clay Loam over Silt Loam; Clay over Clay Loam).

Provide a 2-3 sentence analysis focusing on:
- The measured CEC, the inferred soil texture (per table), and implications for nutrient retention/buffering.
- Brief management considerations aligned with the inferred texture (e.g., leaching risk for sands; compaction/drainage for clays; pH-dependent charge for organics).

Use professional soil science terminology. Focus on practical implications for fertilizer management and soil fertility.
""",
            'soilPh': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's pH status for a Soil Therapy Report.

pH DATA: {', '.join([f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')})" for n in nutrients_data])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Soil pH is a measure of soil acidity or alkalinity on a logarithmic scale from 0 to 14, where 7 is neutral, values below 7 are acidic, and values above 7 are alkaline. pH significantly influences nutrient availability, microbial activity, and plant growth.
- Use percentage-based logic for pH status classification based on deviation from ideal values:
  * **Deficient (Too Acidic)**: More than 25% below the optimal ideal pH value
  * **Marginally Deficient (Slightly Acidic)**: Between 10% and 25% below the optimal ideal pH value  
  * **Optimal**: Between 10% below and 10% above the optimal ideal pH value
  * **Marginally Excessive (Slightly Alkaline)**: Between 10% and 25% above the optimal ideal pH value
  * **Excessive (Too Alkaline)**: Above 25% above the optimal ideal pH value

CRITICAL: You MUST explicitly mention the pH status that exists. If the OPTIMAL list contains pH values, mention them as "optimal". If the MARGINALLY EXCESSIVE list contains pH values, mention them as "marginally excessive". If the DEFICIENT list contains pH values, mention them as "deficient". Do NOT mention categories that are empty.

CRITICAL: If the OPTIMAL list contains pH values, you MUST explicitly mention them as "optimal" in your response. Do NOT say "no optimal pH levels" if the OPTIMAL list contains values.

CRITICAL: Use the correct terminology for pH - describe pH as "acidic", "alkaline", "slightly acidic", "slightly alkaline", etc. Do NOT use terms like "deficient" or "excessive" for pH, and do not use the plural forms "deficiencies" or "excesses" in relation to pH.

CRITICAL: NEVER mention the percentage thresholds (like "30% below", "25% above", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

CRITICAL EXAMPLE: If only MARGINALLY EXCESSIVE contains pH values, say "The pH level is slightly alkaline" but DO NOT say "This indicates that the soil is neither deficient nor marginally deficient in pH, nor marginally excessive or excessive."

PROHIBITED PHRASES (STRICT): Do not write meta-negations for pH such as "no deficiencies or excesses", "neither deficient nor excessive", "neither deficient nor marginally deficient, nor marginally excessive or excessive", "no issues across categories", or similar. pH is a single measure — simply state the status (acidic/alkaline/slightly/optimal) and its implications.

CRITICAL: Do not mention the word "pH" more than 2 times in your response.

ADD SPECIFICITY (STRICT): When status is slightly alkaline/alkaline (pH > 7), briefly name 1–2 likely nutrient availability impacts (e.g., reduced availability of Phosphorus, Iron, Zinc, and Manganese) and 1 biology/process note (e.g., altered microbial activity or slower nutrient release). When status is slightly acidic/acidic (pH < 7), briefly note increased availability of some micronutrients and potential Aluminium solubility issues in strongly acidic conditions. Keep this to one concise clause.

IMPORTANT: Start your analysis by explaining what "soil pH" means, then describe the current pH status. DO NOT include any management recommendations, pH adjustment strategies, or solutions. Focus ONLY on describing the current pH levels and their implications. Avoid any mention of absent categories or negatives like "no deficiencies or excesses".

STRICT OUTPUT FORMAT:
- Use exactly 4 sentences.
- Sentence 1: one-sentence definition of soil pH and why it matters for chemistry, biology, and growth (mention the term once here).
- Sentence 2: start with "This pH level is" or "At pH" and state the status (optimal, slightly acidic, acidic, slightly alkaline, alkaline) with the measured value.
- Sentence 3: describe nutrient availability dynamics appropriate to the status (e.g., near-neutral supports Phosphorus solubility and moderates Iron/Zinc/Manganese availability; low values can increase Aluminium solubility), and include a short note on microbial activity; avoid the word "pH" here.
- Sentence 4: state the practical impact on fertilizer efficiency, buffering, and likely crop performance in one sentence; avoid recommendations and avoid the word "pH" here.
- Do not mention any categories, negations, or the words "deficient", "excess", "neither", or "nor".

List ALL specific pH measurements in each category rather than using general terms. Write your response as ONE SINGLE PARAGRAPH, not multiple paragraphs.

Provide a 4 sentence analysis focusing on:
- Definition of soil pH and its significance for soil chemistry and plant nutrition
- Current status and measured value
- Nutrient availability dynamics and microbiology appropriate to the status
- Implication for fertilizer efficiency, buffering, and crop performance

Use professional soil science terminology. Focus on describing the current situation only.
""",
            'baseSaturation': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's base saturation for a Soil Therapy Report.

BASE SATURATION DATA: {', '.join([f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')})" for n in nutrients_data])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Base saturation represents the percentage of the soil's cation exchange capacity (CEC) occupied by base cations (Calcium, Magnesium, Potassium, Sodium) and acid cations (Aluminum, Hydrogen), which influences soil fertility, nutrient availability, and plant growth.
- Use percentage-based logic for base saturation status classification based on deviation from ideal values:
  * Deficient: More than 40% below the optimal ideal value
  * Marginally Deficient: Between 18% and 40% below the optimal ideal value  
  * Optimal: Between 18% below and 18% above the optimal ideal value
  * Marginally Excessive: Between 18% and 40% above the optimal ideal value
  * Excessive: Above 40% above the optimal ideal value

CRITICAL: You MUST explicitly mention the nutrient status that exists. If the OPTIMAL list contains nutrients, mention them as "optimal". If the DEFICIENT list contains nutrients, mention them as "deficient". If the MARGINALLY DEFICIENT list contains nutrients, mention them as "marginally deficient". If the MARGINALLY EXCESSIVE list contains nutrients, mention them as "marginally excessive". If the EXCESS list contains nutrients, mention them as "excessive". Do NOT mention categories that are empty or say "no deficient nutrients" etc.

STRICT BASE SATURATION FILTER (MANDATORY): Only consider the base saturation nutrients for this section — Calcium, Magnesium, Potassium, Sodium, Aluminium/Aluminum, Hydrogen, and Other Bases. Ignore any nutrients labeled as TAE, LaMotte/Reams, or any with ppm units. Do not introduce nutrients outside this list in any category.

CRITICAL: If the OPTIMAL list contains nutrients, you MUST explicitly mention them as "optimal" in your response. If the MARGINALLY DEFICIENT list contains nutrients, you MUST explicitly mention them as "marginally deficient" in your response. Do NOT say "no optimal nutrients" if the OPTIMAL list contains nutrients.

CRITICAL: NEVER mention the percentage thresholds or ideal ranges (like "65-80%", "10-20%", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

CRITICAL: DO NOT mention any deficiencies or optimal levels for Aluminum, Hydrogen, or Other Bases in this base saturation section. Only discuss these nutrients if they appear in the excessive category, as they are only problematic when excessive. If these nutrients are in the deficient, marginally deficient, or optimal categories, completely ignore them and do not mention them at all.

CRITICAL EXAMPLE: If Hydrogen is in the DEFICIENT list, do NOT say "deficiencies in Hydrogen" or mention Hydrogen at all. If Aluminum is in the MARGINALLY DEFICIENT list, do NOT say "marginally deficient Aluminum" or mention Aluminum at all. Only mention these nutrients if they are in the EXCESSIVE category.

IMPORTANT: Start your analysis by explaining what "base saturation" means, then describe the current nutrient status. DO NOT include any management recommendations, fertilization strategies, or solutions. Focus ONLY on describing the current nutrient levels and their implications.

List ALL specific nutrients in each category rather than using general terms. Write your response as ONE SINGLE PARAGRAPH, not multiple paragraphs.

Provide a 3–4 sentence analysis focusing on:
- Definition of base saturation and its significance for soil fertility and cation balance
- Current base saturation levels across ALL categories (deficient, marginally deficient, optimal, marginally excessive, excessive) and their implications for nutrient availability and plant nutrition
 - End with ONE concluding sentence that succinctly states how this base saturation pattern is likely to impact soil structure (flocculation/dispersion risk where relevant), nutrient availability/buffering, fertilizer efficiency, and crop performance. Do not give recommendations; describe impact only.

NUTRIENT MENTION RULE: When mentioning multiple nutrients in the same category, use the format "Calcium, Magnesium, and Potassium are deficient" or "Nitrogen and Phosphorus are optimal". Always list nutrients in alphabetical order within each category.
""",
              'availableNutrients': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's available nutrients for a Soil Therapy Report.

AVAILABLE NUTRIENTS DATA: {', '.join([f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')})" for n in nutrients_data_clean])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Available nutrients are the plant-available forms of essential nutrients that can be immediately taken up by plant roots, providing the current supply of nutrients that plants can access.
- Use percentage-based logic for nutrient status classification based on deviation from ideal values:
  * Deficient: More than 60% below the optimal ideal value
  * Marginally Deficient: Between 30% and 60% below the optimal ideal value  
  * Optimal: Between 30% below and 30% above the optimal ideal value
  * Marginally Excessive: Between 30% and 70% above the optimal ideal value
  * Excessive: Above 70% above the optimal ideal value

CRITICAL: You MUST explicitly mention the nutrient status that exists. If the OPTIMAL list contains nutrients, mention them as "optimal". If the DEFICIENT list contains nutrients, mention them as "deficient". If the MARGINALLY DEFICIENT list contains nutrients, mention them as "marginally deficient". If the MARGINALLY EXCESSIVE list contains nutrients, mention them as "marginally excessive". If the EXCESS list contains nutrients, mention them as "excessive". Do NOT mention categories that are empty or say "no deficient nutrients" etc.

CRITICAL: If the OPTIMAL list contains nutrients, you MUST explicitly mention them as "optimal" in your response. Do NOT say "no optimal nutrients" if the OPTIMAL list contains nutrients.

CRITICAL ALUMINIUM RULE: DO NOT mention Aluminium/Aluminum unless it appears in the EXCESS category. If Aluminium appears in DEFICIENT, MARGINALLY DEFICIENT, OPTIMAL, or MARGINALLY EXCESSIVE categories, completely ignore it and do not mention it at all. Only mention Aluminium if it is in the EXCESS category, as Aluminium is only problematic when excessive.

CRITICAL: NEVER mention the percentage thresholds (like "30% below", "50% above", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

IMPORTANT: Start your analysis by explaining what "available nutrients" means, then describe the current nutrient status. DO NOT include any management recommendations, fertilization strategies, or solutions. Focus ONLY on describing the current nutrient levels and their implications.

List ALL specific nutrients in each category rather than using general terms. Write your response as ONE SINGLE PARAGRAPH, not multiple paragraphs.

        Provide a 5-6 sentence analysis focusing on:
        - Definition of available nutrients and their significance for plant nutrition and growth
        - Current available nutrient levels across ALL categories (deficient, marginally deficient, optimal, marginally excessive, excessive) and their implications for crop performance and yield potential

        OUTPUT REQUIREMENTS:
        STRICT OUTPUT FORMAT (after the debug list):
        - Use EXACTLY 6 sentences.
        - Sentence 1-2 MUST start with: "Available nutrients are" and give the brief definition.
        - Sentence 3-5 MUST list ONLY the non-empty categories using this exact pattern with labels and semicolons between categories:
          "Deficient: A, B, and C; Marginally deficient: D and E; Optimal: F; Marginally excessive: G; Excessive: H."
        - If a category is empty, OMIT that label entirely (do not write "None").
        - Within each category, list nutrient names in strict alphabetical order, separated by commas, using "and" before the last item. Do not repeat any category label or use filler phrases like "while" or "as well".

        COMPLETENESS REQUIREMENT:
        - The category sentence MUST include EVERY nutrient present in AVAILABLE NUTRIENTS DATA (after normalization and Aluminium rule), each nutrient mentioned EXACTLY ONCE across all categories. Do not omit any nutrient.

        NAME NORMALIZATION & DEDUPLICATION:
        - When writing names, remove any parenthetical extraction method tags like "(Mehlich III)", "(DTPA)", "(KCl)", or "(CaCl2)". Keep "Nitrate-N" and "Ammonium-N" as-is.
        - Treat "Aluminum" and "Aluminium" as the same nutrient. Use the spelling "Aluminium" and NEVER list it twice.
        - Do not mention any nutrient more than once across all categories.

        NUTRIENT MENTION RULE: When mentioning multiple nutrients in the same category, use the format "Nitrate-N, Phosphorus, and Sulfur are deficient" or "Calcium and Magnesium are optimal". Always list nutrients in alphabetical order within each category. Do not add any words other than the category labels, colon, the comma-separated list with "and" before the last item, and semicolons between categories.

Do NOT analyze the raw nutrient data yourself. Use ONLY the classification provided.
""",
            'lamotteReams': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's LaMotte/Reams test results for a Soil Therapy Report.

LAMOTTE/REAMS DATA: {', '.join([
    f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')})"
    for n in nutrients_data
])}

{selected_block}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- LaMotte/Reams testing provides an indication of the amount of plant-available nutrients at the time of sampling, using specific extraction methods that simulate plant root absorption.
- Use percentage-based logic for nutrient status classification based on deviation from ideal values:
  * Deficient: More than 40% below the optimal ideal value
  * Marginally Deficient: Between 18% and 40% below the optimal ideal value  
  * Optimal: Between 18% below and 18% above the optimal ideal value
  * Marginally Excessive: Between 18% and 40% above the optimal ideal value
  * Excessive: Above 40% above the optimal ideal value

SELECTION DIRECTIVE (STRICT):
- The four entries to use have already been preselected for you in the block "SELECTED ENTRIES" above. You MUST use EXACTLY those four, in that exact order, and ignore all other duplicates.

CRITICAL: You MUST explicitly mention the nutrient status that exists. If the OPTIMAL list contains nutrients, mention them as "optimal". If the DEFICIENT list contains nutrients, mention them as "deficient". Do NOT mention categories that are empty or say "no deficient nutrients" etc.

CRITICAL: NEVER mention the percentage thresholds (like "30% below", "50% above", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

IMPORTANT: Start your analysis by explaining what "LaMotte/Reams testing" means, then describe the current nutrient status for the four selected entries only. DO NOT include any management recommendations, fertilization strategies, or solutions. Focus ONLY on describing the current nutrient levels and their implications.

List ALL four nutrients and their statuses. Write your response as ONE SINGLE PARAGRAPH for the analysis (the diagnostic preface is a separate sentence), not multiple paragraphs.

Provide a 2-3 sentence analysis focusing on:
- Definition of LaMotte/Reams testing and its significance for plant nutrition
- Current LaMotte/Reams nutrient levels across ALL categories that apply to the four selected entries and their implications for crop performance

NUTRIENT MENTION RULE: When mentioning multiple nutrients in the same category, list nutrients in alphabetical order within each category.

Use professional soil science terminology. Focus on describing the current situation only.
""",
            'tae': f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis of the soil's Total Available Elements (TAE) for a Soil Therapy Report.

TAE DATA: {', '.join([f"{n.get('name', 'Unknown')}: {n.get('current', 'N/A')} {n.get('unit', '')} (Ideal: {n.get('ideal', 'N/A')} {n.get('unit', '')})" for n in nutrients_data])}

DEFICIENT: {', '.join(deficient) if deficient else 'None'}
MARGINALLY DEFICIENT: {', '.join(marginallyDeficient) if marginallyDeficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
MARGINALLY EXCESSIVE: {', '.join(marginallyExcessive) if marginallyExcessive else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

CRITICAL INSTRUCTIONS:
- Total Available Elements (TAE) represent the total concentration of essential nutrients present in the soil, including both plant-available and potentially available forms that can be released through soil weathering and organic matter decomposition.
- Use percentage-based logic for nutrient status classification based on deviation from ideal values:
  * Deficient: More than 40% below the optimal ideal value
  * Marginally Deficient: Between 18% and 40% below the optimal ideal value  
  * Optimal: Between 18% below and 18% above the optimal ideal value
  * Marginally Excessive: Between 18% and 40% above the optimal ideal value
  * Excessive: Above 40% above the optimal ideal value

STRICT TAE FILTER (MANDATORY): Only consider the following TAE nutrients:
Sodium, Potassium, Calcium, Magnesium, Phosphorus, Aluminium/Aluminum, Copper, Iron, Manganese, Selenium, Zinc, Boron, Silicon, Cobalt, Molybdenum, Sulfur/Sulphur. Ignore any other rows/labels such as explanatory notes or headers (e.g., "Explanatory Notes T.A.E."), and NEVER mention them.

CRITICAL: You MUST explicitly mention the nutrient status that exists. If the OPTIMAL list contains nutrients, mention them as "optimal". If the DEFICIENT list contains nutrients, mention them as "deficient". Do NOT mention categories that are empty or say "no deficient nutrients" etc.

CRITICAL: If the OPTIMAL list contains nutrients, you MUST explicitly mention them as "optimal" in your response. Do NOT say "no optimal nutrients" if the OPTIMAL list contains nutrients.

CRITICAL: NEVER mention the percentage thresholds (like "30% below", "50% above", etc.) in your response. Focus on describing the nutrient status without explaining the calculation method.

CRITICAL: Be fluid on your response when mentioning nutrients on their category. Do not ever say: "Deficient: A, B, C. Excessive: F, G, H". Be more fluid and use sentences like "Your levels are...while...".

IMPORTANT: Start your analysis by explaining what "Total Available Elements (TAE)" means, then describe the current nutrient status. DO NOT include any management recommendations, fertilization strategies, or solutions. Focus ONLY on describing the current nutrient levels and their implications. Do not use phrases like "all other listed elements"; list only the nutrients that actually appear in the provided categories.

List ALL specific nutrients in each category rather than using general terms like "several nutrients" or "various nutrients". Write your response as ONE SINGLE PARAGRAPH, not multiple paragraphs.

Provide a 2-3 sentence analysis focusing on:
- Definition of Total Available Elements (TAE) and their significance for soil fertility and nutrient reserves
- Current TAE levels across ALL categories (deficient, marginally deficient, optimal, marginally excessive, excessive) and their implications for nutrient availability and plant nutrition

NUTRIENT MENTION RULE: When mentioning multiple nutrients in the same category, use the format "Aluminium, Calcium, Magnesium, and Sodium are deficient" or "Potassium and Cobalt are marginally deficient". Always list nutrients in alphabetical order within each category.

Use professional soil science terminology. Focus on describing the current situation only.
"""
        }

        prompt = section_prompts.get(section, f"""
As a professional soil scientist and agronomist, provide a BRIEF analysis for a Soil Therapy Report.

SECTION: {section}
DEFICIENT: {', '.join(deficient) if deficient else 'None'}
OPTIMAL: {', '.join(optimal) if optimal else 'None'}
EXCESS: {', '.join(excess) if excess else 'None'}

Provide a 2-3 sentence analysis focusing on soil health and fertility implications.

NUTRIENT MENTION RULE: When mentioning multiple nutrients in the same category, use the format "nutrients are deficient" or "nutrients are optimal". Always list nutrients in alphabetical order within each category.

Use professional soil science terminology.
""")

        # Debug logging
        print(f"DEBUG - Section: {section}")
        print(f"DEBUG - Deficient: {deficient}")
        print(f"DEBUG - Marginally Deficient: {marginallyDeficient}")
        print(f"DEBUG - Optimal: {optimal}")
        print(f"DEBUG - Marginally Excessive: {marginallyExcessive}")
        print(f"DEBUG - Excess: {excess}")
        print(f"DEBUG - Nutrients data count: {len(nutrients_data)}")
        print(f"DEBUG - Full prompt being sent to AI:")
        print("=" * 50)
        print(prompt)
        print("=" * 50)
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7
        )
        summary = response.choices[0].message.content.strip()
        
        # Debug logging
        print(f"DEBUG - AI Response: {summary}")
        
        # Clean up any overly detailed responses and remove bold markdown
        import re
        cleaned = re.sub(r"\n{3,}", "\n\n", summary)
        # Strip any markdown bolding from AI output for soil comments
        cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", cleaned)
        # Additional sanitation for specific sections
        try:
            if section == 'soilPh':
                # Remove meta-negations like "no deficiencies or excesses" and "neither ... nor ..."
                cleaned = re.sub(r",?\s*with no deficiencies or excess(?:es)?(?:\s*(?:observed|present))?", "", cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r"\bno deficiencies or excess(?:es)?(?:\s*(?:observed|present))?\.?", "", cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r"[^.]*\bneither\b[^.]*\bnor\b[^.]*\.\s*", "", cleaned, flags=re.IGNORECASE)
                # Tidy leftover punctuation/spaces
                cleaned = re.sub(r"\s+,", ",", cleaned)
                cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        except Exception:
            pass
        # No debug echo; return only professional response
        return jsonify({'summary': cleaned.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/proxy/get-ai-comments/<report_ref_id>', methods=['GET'])
def proxy_get_ai_comments(report_ref_id):
    """Proxy endpoint to fetch AI comments from external API to avoid CORS issues"""
    try:
        key = request.args.get('key', '')
        
        # Build the external API URL
        external_url = f'https://nutrition.ntsgrow.com/api/downloadable-charts-pdfs/{report_ref_id}/get_ai_comments/?key={urllib.parse.quote(key)}'
        # external_url = f'http://localhost:8000/api/downloadable-charts-pdfs/{report_ref_id}/get_ai_comments/?key={urllib.parse.quote(key)}'
        
        # Make the request to the external API
        req = urllib.request.Request(external_url, method='GET')
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, timeout=30000) as response:
            data = json.loads(response.read().decode('utf-8'))
            return jsonify(data), response.status
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else 'Unknown error'
        try:
            error_data = json.loads(error_body)
            return jsonify(error_data), e.code
        except:
            return jsonify({'error': error_body}), e.code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
