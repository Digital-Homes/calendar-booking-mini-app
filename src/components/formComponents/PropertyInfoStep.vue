<template>
  <div>
    <h2>Property Information</h2>
    <form @submit.prevent="submitPropertyInfo">
      <FormKit
        type="text"
        v-model="propertyInfo.location"
        @input="fetchLocationSuggestions"
        id="location"
        label="Property Location:"
        required
        autocomplete="off"
      />
      <ul v-if="locationSuggestions.length">
        <li
          v-for="suggestion in locationSuggestions"
          :key="suggestion"
          @click="selectLocation(suggestion)"
        >
          {{ suggestion }}
        </li>
      </ul>

      <FormKit
        type="number"
        v-model="propertyInfo.squareFootage"
        id="squareFootage"
        label="Square Footage:"
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
import { ref } from "vue";
import axios from "axios";

const emit = defineEmits(["propertyInfoSubmitted"]);

const propertyInfo = ref({
  location: "",
  squareFootage: null,
  notes: "",
});

const locationSuggestions = ref([]);

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
          key: "AIzaSyDSnsD51Y5HoEnPc93VDuPn6JBGQVs18Ms",
        },
      }
    );
    locationSuggestions.value = response.data.predictions.map(
      (prediction) => prediction.description
    );
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
  }
};

const selectLocation = (suggestion) => {
  propertyInfo.value.location = suggestion;
  locationSuggestions.value = []; // Clear suggestions after selection
};

const submitPropertyInfo = () => {
  // Ensure that propertyInfo.value is structured correctly
  const emittedPropertyInfo = {
    location: propertyInfo.value.location,
    squareFootage: propertyInfo.value.squareFootage,
    notes: propertyInfo.value.notes,
  };
  emit("propertyInfoSubmitted", emittedPropertyInfo);
};
</script>

<style scoped></style>
