<template>
  <div>
    <h2 class="text-xl mb-4 font-['DM_Sans']">Property Location</h2>
    <form @submit.prevent="submitPropertyInfo">
      <FormKit
        type="text"
        v-model="propertyInfo.location"
        @input="fetchLocationSuggestions"
        id="location"
        label="Enter your address"
        required
        autocomplete="off"
      />
      <ul v-if="locationSuggestions.length">
        <li
          v-for="suggestion in locationSuggestions"
          :key="suggestion"
          @click="selectLocation(suggestion)"
        >
          {{ suggestion.description }}
        </li>
      </ul>

      <FormKit
        type="number"
        v-model="propertyInfo.squareFootage"
        id="squareFootage"
        label="Square Footage"
        required
      />

      <FormKit
        type="textarea"
        v-model="propertyInfo.notes"
        id="notes"
        label="Do you have any specific notes or requests about this property?"
      />

      <FormKit
        type="submit"
        label="Next"
        :classes="{ base: 'submit-button' }"
      />
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import axios from "axios";

const emit = defineEmits(["propertyInfoSubmitted"]);

const propertyInfo = ref({
  location: "",
  squareFootage: null,
  notes: "",
  zipcode: "",
});

const locationSuggestions = ref([]);
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

const fetchLocationSuggestions = async () => {
  if (propertyInfo.value.location.length < 3) {
    locationSuggestions.value = [];
    return;
  }
  try {
    const response = await axios.get(
      `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input: propertyInfo.value.location,
          key: apiKey,
        },
      }
    );
    locationSuggestions.value = response.data.predictions.map((prediction) => ({
      description: prediction.description,
      placeId: prediction.place_id,
    }));
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
  }
};

const selectLocation = async (suggestion) => {
  const { fullAddress, zipcode } = await fetchPlaceDetails(suggestion.placeId);

  if (fullAddress) {
    propertyInfo.value.location = fullAddress; // Update location with full address
    propertyInfo.value.zipcode = zipcode; // Update zipcode with extracted value
    locationSuggestions.value = [];
  }

  locationSuggestions.value = [];

  // Clear suggestions after selection
  setTimeout(() => {
    locationSuggestions.value = []; // Clear suggestions after selection with delay
  }, 50);
};

watch(propertyInfo, (newValue) => {
  console.log("Location updated:", newValue.location);
});

const fetchPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: apiKey,
        },
      }
    );

    const result = response.data.result;

    // Use the formatted address provided by the API
    const formattedAddress = result.formatted_address;

    // Extract ZIP code from address components
    const zipcode = extractZipCodeFromComponents(result.address_components);

    console.log("Formatted Address:", formattedAddress); // Debugging output
    return { fullAddress: formattedAddress, zipcode }; // Return both formatted address and ZIP code
  } catch (error) {
    console.error("Error fetching place details:", error);
    return { fullAddress: null, zipcode: "" }; // Return null address and empty zipcode on error
  }
};

// Function to extract ZIP code from address components
const extractZipCodeFromComponents = (components) => {
  const zipCodeComponent = components.find((component) =>
    component.types.includes("postal_code")
  );
  return zipCodeComponent ? zipCodeComponent.long_name : ""; // Return the ZIP code or an empty string if not found
};

const submitPropertyInfo = () => {
  // Ensure that propertyInfo.value is structured correctly
  const emittedPropertyInfo = {
    location: propertyInfo.value.location,
    squareFootage: propertyInfo.value.squareFootage,
    notes: propertyInfo.value.notes,
    zipcode: propertyInfo.value.zipcode, // Include the zipcode when emitting
  };
  emit("propertyInfoSubmitted", emittedPropertyInfo);
};
</script>

<style scoped></style>
