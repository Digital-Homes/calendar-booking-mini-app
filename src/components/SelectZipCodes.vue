<template>
  <div class="mx-auto my-16 max-w-[768px] font-['DM_Sans']">
    <link
      rel="stylesheet"
      href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css"
      type="text/css"
    />

    <h2 class="mb-4">Click the map to draw a polygon.</h2>
    <!-- Message while calculating ZIP codes -->
    <span v-if="isCalculating">
      <div class="spinner"></div>
      <p class="mb-4">Calculating ZIP codes</p>
    </span>
    <h2 v-if="calculatedZipCodes.length > 0" class="mb-4">
      Service Zipcodes: {{ calculatedZipCodes }}
    </h2>
    <button
      v-if="polygonExists"
      @click="clearPolygon"
      class="px-4 py-2 mb-4 bg-blue-500 text-white rounded"
    >
      Draw New Polygon
    </button>
    <div id="map" class="map-container"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

// Mapbox access token
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN; // Use your Mapbox access token

// Airtable API config
const airtableApiKey = import.meta.env.VITE_AIRTABLE_TOKEN;
const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const airtableTableName = import.meta.env.VITE_PHOTOGRAPHER_TABLE_ID; // Photographers table

// Retrieve the record ID from URL
const recordId = new URLSearchParams(window.location.search).get("recordId");

// Refs for the Mapbox map, zip code display, and polygon control
const map = ref(null);
const calculatedZipCodes = ref("");
const polygonExists = ref(false); // Track if a polygon is present
let draw; // Define draw as a regular variable
const isCalculating = ref(false);

// On mounted, initialize the Mapbox map
onMounted(() => {
  mapboxgl.accessToken = mapboxToken;
  map.value = new mapboxgl.Map({
    container: "map", // Container ID
    style: "mapbox://styles/mapbox/streets-v12", // Map style
    center: [-91.874, 42.76], // Initial position [lng, lat]
    zoom: 12, // Initial zoom
  });

  // Initialize Mapbox Draw
  draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: false, // Disable trash control (manual clear with button)
    },
    defaultMode: "draw_polygon",
  });
  map.value.addControl(draw);

  // Listen for drawing events
  map.value.on("draw.create", handleDraw);
  map.value.on("draw.update", handlePolygonEdit);
});

// Function to handle drawing events
const handleDraw = async () => {
  if (polygonExists.value) return; // Prevent additional polygons from being drawn

  const data = draw.getAll();
  if (data.features.length > 0) {
    polygonExists.value = true; // Mark polygon as existing
    const polygonCoordinates = data.features[0].geometry.coordinates[0];

    // Generate points inside the polygon and get ZIP codes
    const zipCodes = await getZipCodesFromPolygon(polygonCoordinates);
    calculatedZipCodes.value = zipCodes.join(", ");

    // Update the Airtable record with ZIP codes
    await updateAirtableRecord(recordId, calculatedZipCodes.value);
  } else {
    calculatedZipCodes.value = "";
    alert("Click the map to draw a polygon.");
  }
};

// Function to clear the polygon and allow drawing a new one
const clearPolygon = () => {
  draw.deleteAll(); // Remove all polygons from the map
  polygonExists.value = false; // Reset polygon state
  calculatedZipCodes.value = ""; // Clear ZIP code display

  // Enable drawing a new polygon
  draw.changeMode("draw_polygon");
};

// Function to generate points within the polygon using Turf.js and get ZIP codes
const getZipCodesFromPolygon = async (polygon) => {
  isCalculating.value = true;
  const points = getPointsInPolygon(polygon);
  const zipCodes = await reverseGeocodeZip(points);
  isCalculating.value = false;
  return [...new Set(zipCodes)]; // Return unique ZIP codes
};

// Function to generate points within the polygon using Turf.js
const getPointsInPolygon = (polygon) => {
  const bbox = turf.bbox(turf.polygon([polygon]));
  const grid = turf.pointGrid(bbox, 1); // Generate a grid of points (1 km apart)

  const pointsInPolygon = grid.features.filter((point) =>
    turf.booleanPointInPolygon(point, turf.polygon([polygon]))
  );

  return pointsInPolygon.map((point) => point.geometry.coordinates); // Return [lon, lat] format
};

// Function to reverse geocode ZIP codes from points
const reverseGeocodeZip = async (coordinates) => {
  const apiKey = import.meta.env.VITE_GEOCODE_API; // Use your Geocodio API key
  let zipCodesArray = [];
  for (const coord of coordinates) {
    const [lng, lat] = coord;

    try {
      const response = await fetch(
        `https://api.geocod.io/v1.7/reverse?api_key=${apiKey}&q=${lat},${lng}`
      );

      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result) => {
          if (result && result.address_components) {
            zipCodesArray.push(result.address_components.zip);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching ZIP codes:", error);
    }
  }
  return zipCodesArray;
};

// Function to handle polygon edits and recalculate ZIP codes
const handlePolygonEdit = async () => {
  const data = draw.getAll();
  if (data.features.length > 0) {
    const polygonCoordinates = data.features[0].geometry.coordinates[0];

    // Generate points inside the updated polygon and get ZIP codes
    const zipCodes = await getZipCodesFromPolygon(polygonCoordinates);
    calculatedZipCodes.value = zipCodes.join(", ");

    // Update the Airtable record with the new ZIP codes
    await updateAirtableRecord(recordId, calculatedZipCodes.value);
  } else {
    alert("Polygon no longer exists. Draw a new one.");
  }
};

// Function to update Airtable record
const updateAirtableRecord = async (recordId, zipCodes) => {
  const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;

  try {
    await axios.patch(
      url,
      {
        fields: {
          ["Service Zip Codes"]: zipCodes,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error updating Airtable:", error);
  }
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 500px;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
}
button {
  cursor: pointer;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
