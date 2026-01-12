import pandas as pd
import io
from shapely.geometry import shape, Point

def load_data(uploaded_file):
    try:
        file_name = uploaded_file.name
        raw_content = uploaded_file.getvalue()
        
        if file_name.lower().endswith('.xlsx'):
            df = pd.read_excel(uploaded_file, dtype=str)
        else:
            text = raw_content.decode('utf-8', errors='ignore')
            lines = text.splitlines()
            header_idx = 0
            # On cherche la ligne qui contient l'entête réelle
            for i, line in enumerate(lines):
                if "Tracking No." in line:
                    header_idx = i
                    break
            df = pd.read_csv(io.StringIO("\n".join(lines[header_idx:])), sep=None, engine='python', dtype=str)

        df.columns = [c.strip() for c in df.columns]

        def split_gps(val):
            try:
                if pd.isna(val) or ',' not in str(val): return None, None
                parts = str(val).replace('"', '').split(',')
                return float(parts[0].strip()), float(parts[1].strip())
            except: return None, None

        gps_col = "Receiver to (Latitude,Longitude)"
        if gps_col in df.columns:
            coords = df[gps_col].apply(lambda x: pd.Series(split_gps(x)))
            df['lat'] = pd.to_numeric(coords[0], errors='coerce')
            df['lon'] = pd.to_numeric(coords[1], errors='coerce')
            return df, None
        return None, "Colonne GPS introuvable."
    except Exception as e:
        return None, str(e)

def filtrer_colis_par_zone(df, last_draw):
    if not last_draw or 'geometry' not in last_draw or df.empty:
        return pd.DataFrame()
    polygon = shape(last_draw['geometry'])
    df_valid = df.dropna(subset=['lat', 'lon']).copy()
    mask = df_valid.apply(lambda r: polygon.contains(Point(float(r['lon']), float(r['lat']))), axis=1)
    return df_valid[mask]

def preparer_telechargement_excel(df_selection):
    output_bin = io.BytesIO()
    df_export = df_selection.drop(columns=['lat', 'lon'], errors='ignore')
    with pd.ExcelWriter(output_bin, engine='openpyxl') as writer:
        df_export.to_excel(writer, index=False)
    return output_bin.getvalue()