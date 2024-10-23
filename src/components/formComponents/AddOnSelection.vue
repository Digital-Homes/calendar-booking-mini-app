<template>
  <div class="max-w-[1050px] mx-auto">
    <h2
      class="text-xl mb-4 font-['DM_Sans'] flex flex-col items-center justify-center mt-20"
    >
      Select Add-Ons
    </h2>
    <div class="product-cards flex flex-row">
      <div v-for="addOn in addOns" :key="addOn.id" class="product-card">
        <div
          class="product-images"
          v-if="addOn.fields.Image && addOn.fields.Image.length"
        >
          <img
            v-for="image in addOn.fields.Image"
            :key="image.id"
            :src="image.url"
            alt="Add-On Image"
            class="product-image"
          />
        </div>
        <h3>{{ addOn.fields.Name }}</h3>
        <p v-if="addOn.fields.Price">${{ addOn.fields.Price }}</p>
        <FormKit
          type="button"
          label="Add to Cart"
          @click="selectAddOn(addOn.id)"
          class="add-to-cart-button"
        />
      </div>
    </div>
    <div>
      <FormKit type="button" label="Previous Step" @click="$emit('goBack')" />
      <FormKit type="button" label="Next Step" @click="handleNextClick" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from "vue"; // Import defineProps
import axios from "axios";

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;
const addonsTable = import.meta.env.VITE_ADD_ONS_TABLE_ID;

// Define props to accept selectedProducts
const props = defineProps(["selectedProducts"]);
const emit = defineEmits(["addToCart", "next"]); // Define the emit for adding to the cart

const addOns = ref([]); // Reactive reference for add-ons

// Fetch add-ons based on the IDs from selectedProducts
const fetchAddOns = async () => {
  try {
    // Create a unique set of add-on IDs from selected products
    const addOnIds = props.selectedProducts.flatMap(
      (product) => product.fields["Add-ons"] || []
    );

    if (addOnIds.length === 0) return []; // Return if no add-ons exist

    // Make an API call to Airtable to fetch the add-ons based on the IDs
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${addonsTable}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
        params: {
          filterByFormula: `FIND(RECORD_ID(), "${addOnIds.join(",")}")`,
        },
      }
    );

    return response.data.records; // Return the add-ons from the response
  } catch (error) {
    console.error("Error fetching add-ons:", error);
    return []; // Return an empty array in case of error
  }
};

onMounted(async () => {
  // Fetch add-ons based on the selected product IDs
  addOns.value = await fetchAddOns();
});

const selectAddOn = (id) => {
  const selectedAddOn = addOns.value.find((addOn) => addOn.id === id);
  if (selectedAddOn) {
    emit("addToCart", selectedAddOn); // Emit the selected add-on to update the cart
  }
};

const handleNextClick = () => {
  emit("next"); // Emit an event to proceed to the photographer selection step
};
</script>

<style scoped>
.product-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.product-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  width: 200px;
  text-align: center;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.product-image {
  max-width: 100%;
  border-radius: 4px;
}
.variant-dropdown {
  margin-top: 10px;
  padding: 8px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
}
.add-to-cart-button {
  /* Normal button styles */
  background-color: #007bff; /* Example color */
  color: white; /* Text color */
  padding: 10px 15px; /* Padding */
  border: none; /* No border */
  border-radius: 5px; /* Rounded corners */
  cursor: pointer; /* Pointer cursor for hover */
  transition: background-color 0.3s; /* Smooth background transition */
}

.add-to-cart-button:disabled {
  background-color: #b0d4ff; /* Faded color when disabled */
  color: #6c757d; /* Change text color */
  cursor: not-allowed; /* Change cursor to indicate disabled */
  opacity: 0.65; /* Fade effect */
}

.add-to-cart-button:hover {
  background-color: #0056b3;
}

.notification {
  background-color: #4caf50; /* Green background */
  color: white; /* White text */
  padding: 10px;
  margin-bottom: 15px;
  text-align: center;
  border-radius: 5px;
}

.cart-summary {
  background-color: #f9f9f9;
  padding: 10px;
  margin-top: 15px;
  text-align: left;
  border: 1px solid #ddd;
  border-radius: 5px;
}
</style>
