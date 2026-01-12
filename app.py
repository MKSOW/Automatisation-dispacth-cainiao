import streamlit as st
from streamlit_folium import st_folium
import folium

st.set_page_config(page_title="Automatisation Dispatch Cainiao", layout="wide")

st.title("📦 Automatisation Dispatch Cainiao")

# --- Initialisation session_state ---
if "map_output" not in st.session_state:
    st.session_state.map_output = None

# --- Carte ---
m = folium.Map(location=[48.8566, 2.3522], zoom_start=6)

draw = folium.plugins.Draw(
    export=False,
    draw_options={
        "polyline": False,
        "rectangle": True,
        "circle": False,
        "circlemarker": False,
        "marker": False,
        "polygon": True,
    },
    edit_options={"edit": True},
)
draw.add_to(m)

# --- Affichage carte + stockage résultat ---
st.session_state.map_output = st_folium(
    m,
    height=600,
    width="100%",
    key="map_cainiao",
)

# --- Récupération du dernier dessin ---
last_draw = None
map_output = st.session_state.get("map_output")

if map_output and map_output.get("all_drawings"):
    last_draw = map_output["all_drawings"][-1]

# --- Affichage debug ---
st.subheader("🧪 Debug")
st.write("Dernier dessin :", last_draw)

# --- Exemple d'utilisation ---
if last_draw:
    st.success("✅ Une zone a bien été dessinée")
else:
    st.info("ℹ️ Dessine une zone sur la carte")
