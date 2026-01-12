import streamlit as st
import pandas as pd
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium
from data_processor import load_data, filtrer_colis_par_zone, preparer_telechargement_excel

st.set_page_config(layout="wide", page_title="Cainiao Expert Dispatch")

st.title("🗺️ Dispatcher Visuel - Cainiao Expert")

uploaded_file = st.file_uploader("Charger le fichier Cainiao", type=['csv', 'xlsx'])

# --- CORRECTION CRITIQUE : Initialisation de la variable ---
output = None 

if uploaded_file:
    df, error = load_data(uploaded_file)
    if error:
        st.error(error)
    else:
        if 'lat' in df.columns and 'lon' in df.columns:
            st.subheader("🔍 Filtre par Codes Postaux")
            codes_input = st.text_input("Ex: 51100, 08400")
            
            df_filtered = df.copy()
            if codes_input:
                list_codes = [c.strip() for c in codes_input.split(',') if c.strip()]
                df_filtered = df[df['Sort Code'].astype(str).str.contains('|'.join(list_codes), na=False)]

            df_map = df_filtered.dropna(subset=['lat', 'lon']).copy()
            
            col_map, col_ctrl = st.columns([3, 1])

            with col_map:
                if not df_map.empty:
                    st.markdown("🔴 08 | 🔵 51 | 🟢 02", unsafe_allow_html=True)
                    m = folium.Map(location=[df_map['lat'].mean(), df_map['lon'].mean()], zoom_start=10)
                    Draw(export=False, draw_options={'polyline': False, 'circle': False, 'marker': False, 'polygon': True, 'rectangle': True}).add_to(m)

                    for i, row in df_map.iterrows():
                        cp = str(row['Sort Code'])
                        dot_color = "red" if cp.startswith(('08', '8')) else "blue" if cp.startswith('51') else "green" if cp.startswith(('02', '2')) else "gray"
                        folium.CircleMarker(location=[float(row['lat']), float(row['lon'])], radius=4, color=dot_color, fill=True).add_to(m)

                    # On assigne le résultat de la carte à output
                    output = st_folium(m, width="100%", height=600, key="map_cainiao")
                else:
                    st.warning("Aucun colis trouvé pour ces codes postaux.")

            with col_ctrl:
                st.subheader("📦 Attribution")
                
                # Vérification si output a été défini et contient des dessins
                last_draw = None
                if output and 'all_drawings' in output and output['all_drawings']:
                    last_draw = output['all_drawings'][-1]
                
                if last_draw:
                    sel = filtrer_colis_par_zone(df_map, last_draw)
                    st.metric("Sélection", len(sel))
                    if not sel.empty:
                        nom = st.text_input("Nom Chauffeur :", value="Tournee")
                        data = preparer_telechargement_excel(sel)
                        st.download_button(label=f"📥 Télécharger", data=data, file_name=f"Dispatch_{nom}.xlsx")
                else:
                    st.info("💡 Tracez une zone sur la carte (outil à gauche) pour commencer.")
        else:
            st.error("Impossible de lire les colonnes GPS. Vérifiez votre fichier.")