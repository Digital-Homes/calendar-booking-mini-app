<template>
  <div>
    <h2>Select Add-Ons</h2>
    <div class="product-cards">
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
        <p v-if="addOn.fields.Description">
          {{ addOn.fields.Description }}
        </p>
        <FormKit
          type="button"
          label="Add to Cart"
          @click="selectAddOn(addOn.id)"
          class="add-to-cart-button"
        />
      </div>
    </div>
    <FormKit type="button" label="Back" @click="$emit('goBack')" />
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
const emit = defineEmits(["addToCart"]); // Define the emit for adding to the cart

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
          filterByFormula: `FIND(RECORD_ID(), "${addOnIds.join(",")}")`, // Adjust this formula based on your needs
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
</style>
