import streamlit as st
import pandas as pd
import folium
from folium.plugins import Draw
from streamlit_folium import st_folium

from data_processor import (
    load_data,
    filtrer_colis_par_zone,
    preparer_telechargement_excel
)

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
st.set_page_config(
    page_title="Cainiao Expert Dispatch",
    layout="wide"
)

st.title("🗺️ Dispatcher Visuel - Cainiao Expert")

# --------------------------------------------------
# SESSION STATE INIT (CRITIQUE)
# --------------------------------------------------
if "map_output" not in st.session_state:
    st.session_state.map_output = None

# --------------------------------------------------
# UPLOAD
# --------------------------------------------------
uploaded_file = st.file_uploader(
    "📂 Charger le fichier Cainiao",
    type=["csv", "xlsx"]
)

if not uploaded_file:
    st.info("Veuillez charger un fichier pour commencer.")
    st.stop()

# --------------------------------------------------
# DATA LOAD
# --------------------------------------------------
df, error = load_data(uploaded_file)

if error:
    st.error(error)
    st.stop()

if "lat" not in df.columns or "lon" not in df.columns:
    st.error("Colonnes GPS absentes ou invalides.")
    st.stop()

# --------------------------------------------------
# FILTRE CP
# --------------------------------------------------
st.subheader("🔍 Filtre par Codes Postaux")
codes_input = st.text_input("Ex: 51100, 08400")

df_filtered = df.copy()

if codes_input:
    list_codes = [c.strip() for c in codes_input.split(",") if c.strip()]
    df_filtered = df_filtered[
        df_filtered["Sort Code"].astype(str).str.contains("|".join(list_codes), na=False)
    ]

df_map = df_filtered.dropna(subset=["lat", "lon"]).copy()

# --------------------------------------------------
# LAYOUT
# --------------------------------------------------
col_map, col_ctrl = st.columns([3, 1])

# --------------------------------------------------
# MAP
# --------------------------------------------------
with col_map:
    if df_map.empty:
        st.warning("Aucun colis à afficher.")
    else:
        st.markdown("🔴 08 | 🔵 51 | 🟢 02", unsafe_allow_html=True)

        m = folium.Map(
            location=[df_map["lat"].mean(), df_map["lon"].mean()],
            zoom_start=10
        )

        Draw(
            export=False,
            draw_options={
                "polyline": False,
                "circle": False,
                "marker": False,
                "polygon": True,
                "rectangle": True,
            }
        ).add_to(m)

        for _, row in df_map.iterrows():
            cp = str(row.get("Sort Code", ""))

            color = (
                "red" if cp.startswith(("08", "8")) else
                "blue" if cp.startswith("51") else
                "green" if cp.startswith(("02", "2")) else
                "gray"
            )

            folium.CircleMarker(
                location=[float(row["lat"]), float(row["lon"])],
                radius=4,
                color=color,
                fill=True,
                fill_opacity=0.8
            ).add_to(m)

        st.session_state.map_output = st_folium(
            m,
            height=600,
            width="100%",
            key="map_cainiao"
        )

# --------------------------------------------------
# ATTRIBUTION
# --------------------------------------------------
with col_ctrl:
    st.subheader("📦 Attribution")

    output = st.session_state.map_output
    last_draw = None

    if output and output.get("all_drawings"):
        last_draw = output["all_drawings"][-1]

    if not last_draw:
        st.info("✏️ Dessinez une zone sur la carte.")
        st.stop()

    selection = filtrer_colis_par_zone(df_map, last_draw)

    st.metric("Colis sélectionnés", len(selection))

    if selection.empty:
        st.warning("Aucun colis dans cette zone.")
        st.stop()

    nom = st.text_input("Nom Chauffeur", value="Tournee")

    data = preparer_telechargement_excel(selection)

    st.download_button(
        "📥 Télécharger la tournée",
        data=data,
        file_name=f"Dispatch_{nom}.xlsx"
    )
