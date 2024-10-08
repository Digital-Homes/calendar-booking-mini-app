<template>
  <div>
    <FormKit
      type="button"
      label="Back to Categories"
      @click="$emit('goBackToCategories')"
      class="back-to-categories-button"
    />

    <div v-if="isLoading">Loading products...</div>
    <div v-if="notification" class="notification">
      {{ notification }}
    </div>

    <div v-if="cart.length > 0" class="cart-summary">
      <p>Total items in cart: {{ totalItems }}</p>
      <p>Total price: ${{ totalPrice }}</p>
    </div>

    <div v-if="!isLoading && airtableData.length">
      <div class="product-cards">
        <div
          v-for="record in airtableData"
          :key="record.id"
          class="product-card"
        >
          <div
            class="product-images"
            v-if="record.fields.Image && record.fields.Image.length"
          >
            <img
              v-for="image in record.fields.Image"
              :key="image.id"
              :src="image.url"
              alt="Product image"
              class="product-image"
            />
          </div>
          <h3>{{ record.fields.Name }}</h3>
          <p v-if="record.fields.Price">${{ record.fields.Price }}</p>
          <p v-if="record.fields.Description">
            {{ record.fields.Description }}
          </p>

          <!-- Display dropdown for variants if they exist -->
          <div v-if="record.fields.Variants && record.fields.Variants.length">
            <label for="variantSelect">Choose a variant:</label>
            <select
              id="variantSelect"
              class="variant-dropdown"
              v-model="record.selectedVariant"
            >
              <option
                v-for="variant in record.fields.Variants"
                :key="variant.id"
                :value="variant"
              >
                {{ variant.name }} - ${{ variant.price }}
              </option>
            </select>
          </div>
          <FormKit
            type="button"
            label="Add to Cart"
            :disabled="record.fields.Variants && !record.selectedVariant"
            @click="addToCart(record)"
            class="add-to-cart-button"
          />
        </div>
      </div>
    </div>
    <div v-if="!isLoading && airtableData.length === 0">No products found.</div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from "vue";
import axios from "axios";

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const serviceTable = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;
const variantsTable = import.meta.env.VITE_VARIANTS_TABLE_ID;

const props = defineProps({
  category: String,
  squareFootage: Number, // Pass squareFootage as a prop
});

const airtableData = ref([]);
const isLoading = ref(false);
const cart = ref([]);
const notification = ref(null);

const emit = defineEmits(["updateCart"]);

const totalItems = computed(() => cart.value.length);
const totalPrice = computed(() =>
  cart.value.reduce((sum, product) => {
    // Check if the product has a selected variant with a price
    const price = product.selectedVariant
      ? parseFloat(product.selectedVariant.price)
      : parseFloat(product.fields.Price);

    return !isNaN(price) ? sum + price : sum;
  }, 0)
);

// Fetch data for selected category
const fetchDataFromAirtable = async () => {
  isLoading.value = true; // Show the loader while data is being fetched
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${serviceTable}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
        params: {
          filterByFormula: `FIND('${props.category}', {Type})`, // Ensure proper Airtable formula syntax
        },
      }
    );

    airtableData.value = await Promise.all(
      response.data.records.map(async (record) => {
        // Fetch variants if they exist
        if (record.fields.Variants && record.fields.Variants.length) {
          const variantIds = record.fields.Variants.join(",");
          const variantResponse = await axios.get(
            `https://api.airtable.com/v0/${airtableBaseId}/${variantsTable}`,
            {
              headers: {
                Authorization: `Bearer ${airtableToken}`,
              },
              params: {
                filterByFormula: `OR(${variantIds
                  .split(",")
                  .map((id) => `RECORD_ID()='${id}'`)
                  .join(",")})`,
              },
            }
          );

          // Filter variants based on min and max values
          record.fields.Variants = variantResponse.data.records
            .map((variant) => {
              const minSquareFeet = variant.fields["Minimum Square Footage"]
                ? parseFloat(variant.fields["Minimum Square Footage"])
                : null;
              const maxSquareFeet = variant.fields["Maximum Square Footage"]
                ? parseFloat(variant.fields["Maximum Square Footage"])
                : null;

              const isValidVariant =
                (minSquareFeet === null ||
                  props.squareFootage >= minSquareFeet) &&
                (maxSquareFeet === null ||
                  props.squareFootage <= maxSquareFeet);

              return isValidVariant
                ? {
                    id: variant.id,
                    name: variant.fields.Name,
                    price: variant.fields.Price,
                  }
                : null;
            })
            .filter(Boolean);
        }

        return record;
      })
    );
  } catch (error) {
    console.error("Error fetching data from Airtable:", error);
  } finally {
    isLoading.value = false; // Hide the loader after the data is fetched
  }
};

const addToCart = (product) => {
  const selectedVariant = product.selectedVariant;

  cart.value.push({
    ...product,
    selectedVariant: selectedVariant || null,
  });

  notification.value = `${product.fields.Name} ${
    selectedVariant ? `(${selectedVariant.name})` : ""
  } has been added to your cart!`;

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notification.value = null;
  }, 5000);

  emit("updateCart", cart.value);
};

// Call fetch function when the component is mounted
fetchDataFromAirtable();
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
