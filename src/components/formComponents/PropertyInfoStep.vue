<template>
  <div>
    <h2 class="text-xl mb-4 font-['DM_Sans']">Property Location</h2>
    <form @submit.prevent="submitPropertyInfo" class="font-['DM_Sans']">
      <FormKit
        type="text"
        v-model="propertyInfo.location"
        @input="fetchLocationSuggestions"
        id="location"
        label="Enter address to view services and pricing"
        required
        autocomplete="off"
        class="font-['DM_Sans']"
      />
      <ul
        v-if="locationSuggestions.length && !locationSelected"
        class="mt-2 border rounded-lg shadow-lg bg-white z-10"
      >
        <li
          v-for="suggestion in locationSuggestions"
          :key="suggestion"
          @click="selectLocation(suggestion)"
          class="cursor-pointer p-2 hover:bg-gray-100 font-['DM_Sans']"
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
        class="font-['DM_Sans']"
      />

      <FormKit
        type="textarea"
        v-model="propertyInfo.notes"
        id="notes"
        label="Do you have any specific notes or requests about this property?"
        class="font-['DM_Sans']"
      />
      <div class="flex justify-between items-center w-full mt-4">
        <!-- Prev Step button aligned to the left -->
        <div>
          <FormKit
            type="button"
            label="Prev Step"
            @click="backToEmailStep"
            class="mr-auto"
          />
        </div>
        <div>
          <!-- Next Step button aligned to the right -->
          <FormKit type="submit" label="Next Step" class="ml-auto" />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import axios from "axios";

const emit = defineEmits(["propertyInfoSubmitted"]);

const propertyInfo = ref({
  location: "",
  squareFootage: null,
  notes: "",
  zipcode: "",
});

const locationSuggestions = ref([]);
const locationSelected = ref(false);

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

const fetchLocationSuggestions = async () => {
  if (propertyInfo.value.location.length < 3) {
    locationSuggestions.value = [];
    return;
  }
  try {
    locationSelected.value = false;
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
  locationSelected.value = true;
  try {
    const { fullAddress, zipcode } = await fetchPlaceDetails(
      suggestion.placeId
    );

    if (fullAddress) {
      propertyInfo.value.location = fullAddress;
      propertyInfo.value.zipcode = zipcode;

      // // Force clear suggestions after selection
      setTimeout(() => {
        locationSuggestions.value.length = 0; // Clear suggestions array completely
      }, 10);
    }
  } catch (error) {
    console.error("Error fetching place details:", error);
  }
};

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

const backToEmailStep = () => {
  emit("emailStep");
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
