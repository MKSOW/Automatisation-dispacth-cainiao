"""Service for parsing and uploading parcel files (GOFO and CAINIAO)."""
from io import BytesIO
from typing import Literal
from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.models.orm import Parcel


class UploadResult:
    """Result of an upload operation."""
    def __init__(self):
        self.total_rows: int = 0
        self.inserted: int = 0
        self.duplicates: int = 0
        self.errors: list[str] = []


def parse_gofo_file(file_content: bytes) -> list[dict]:
    """
    Parse a GOFO Excel file and extract parcel data.
    
    GOFO columns:
    - Name, Street, City, State/Region, Postal, Country
    - Note (contains tracking number)
    - Latitude, Longitude
    """
    df = pd.read_excel(BytesIO(file_content))
    
    required_cols = ['Note', 'Street', 'City', 'Postal', 'Latitude', 'Longitude']
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans le fichier GOFO: {missing}")
    
    parcels = []
    for _, row in df.iterrows():
        tracking = str(row.get('Note', '')).strip()
        if not tracking or tracking == 'nan':
            continue
            
        # Build address from components
        street = str(row.get('Street', '')).strip()
        city = str(row.get('City', '')).strip()
        postal = str(row.get('Postal', '')).strip()
        
        # Clean up 'nan' values
        street = '' if street == 'nan' else street
        city = '' if city == 'nan' else city
        postal = '' if postal == 'nan' else postal
        
        address_parts = [p for p in [street, postal, city] if p]
        address = ', '.join(address_parts)
        
        lat = row.get('Latitude')
        lon = row.get('Longitude')
        
        parcels.append({
            'tracking_no': tracking,
            'source': 'GOFO',
            'address': address,
            'latitude': str(lat) if pd.notna(lat) else None,
            'longitude': str(lon) if pd.notna(lon) else None,
            'status': 'pending'
        })
    
    return parcels


def parse_cainiao_file(file_content: bytes) -> list[dict]:
    """
    Parse a CAINIAO Excel file and extract parcel data.
    
    CAINIAO columns:
    - Tracking No.
    - Sort Code
    - Receiver's City
    - Receiver's Detail Address
    - Receiver to (Latitude,Longitude)
    """
    df = pd.read_excel(BytesIO(file_content))
    
    required_cols = ['Tracking No.', "Receiver's Detail Address"]
    missing = [col for col in required_cols if col not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans le fichier CAINIAO: {missing}")
    
    parcels = []
    for _, row in df.iterrows():
        tracking = str(row.get('Tracking No.', '')).strip()
        if not tracking or tracking == 'nan':
            continue
        
        # Build address
        detail_addr = str(row.get("Receiver's Detail Address", '')).strip()
        city = str(row.get("Receiver's City", '')).strip()
        sort_code = str(row.get('Sort Code', '')).strip()
        
        # Clean 'nan' values
        detail_addr = '' if detail_addr == 'nan' else detail_addr
        city = '' if city == 'nan' else city
        sort_code = '' if sort_code == 'nan' else sort_code
        
        address_parts = [p for p in [detail_addr, sort_code, city] if p]
        address = ', '.join(address_parts)
        
        # Parse coordinates from "Lat,Long" format
        lat, lon = None, None
        coords = str(row.get('Receiver to (Latitude,Longitude)', '')).strip()
        if coords and coords != 'nan' and ',' in coords:
            try:
                parts = coords.split(',')
                lat = parts[0].strip()
                lon = parts[1].strip()
            except (IndexError, ValueError):
                pass
        
        parcels.append({
            'tracking_no': tracking,
            'source': 'CAINIAO',
            'address': address,
            'latitude': lat,
            'longitude': lon,
            'status': 'pending'
        })
    
    return parcels


def upload_parcels(
    db: Session, 
    file_content: bytes, 
    file_type: Literal['gofo', 'cainiao']
) -> UploadResult:
    """
    Upload parcels from an Excel file to the database.
    
    Uses upsert logic: existing tracking numbers are skipped (not updated).
    """
    result = UploadResult()
    
    try:
        if file_type == 'gofo':
            parcels = parse_gofo_file(file_content)
        else:
            parcels = parse_cainiao_file(file_content)
    except Exception as e:
        result.errors.append(f"Erreur de parsing: {str(e)}")
        return result
    
    result.total_rows = len(parcels)
    
    if not parcels:
        result.errors.append("Aucun colis valide trouvé dans le fichier")
        return result
    
    # Insert parcels, skip duplicates
    for parcel_data in parcels:
        try:
            # Check if tracking already exists
            existing = db.query(Parcel).filter(
                Parcel.tracking_no == parcel_data['tracking_no']
            ).first()
            
            if existing:
                result.duplicates += 1
                continue
            
            parcel = Parcel(**parcel_data)
            db.add(parcel)
            result.inserted += 1
        except Exception as e:
            result.errors.append(f"Erreur pour {parcel_data.get('tracking_no')}: {str(e)}")
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        result.errors.append(f"Erreur de commit: {str(e)}")
        result.inserted = 0
    
    return result


def get_upload_stats(db: Session) -> dict:
    """Get statistics about uploaded parcels."""
    total = db.query(Parcel).count()
    gofo_count = db.query(Parcel).filter(Parcel.source == 'GOFO').count()
    cainiao_count = db.query(Parcel).filter(Parcel.source == 'CAINIAO').count()
    pending = db.query(Parcel).filter(Parcel.status == 'pending').count()
    assigned = db.query(Parcel).filter(Parcel.status == 'assigned').count()
    
    return {
        'total_parcels': total,
        'gofo_count': gofo_count,
        'cainiao_count': cainiao_count,
        'pending': pending,
        'assigned': assigned
    }
