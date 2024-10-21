<template>
  <div>
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-screen"
    >
      <div class="spinner"></div>
      <h2 class="font-['DM_Sans']">Loading products</h2>
    </div>

    <div v-if="notification" class="notification">
      {{ notification }}
    </div>

    <div v-if="!isLoading && airtableData.length">
      <h2
        class="text-xl mb-4 font-['DM_Sans'] flex flex-col items-center justify-center mt-20"
      >
        Choose Your Service
      </h2>

      <div class="product-cards">
        <div
          v-for="record in airtableData"
          :key="record.id"
          class="product-card h-300"
        >
          <div class="product-images">
            <img
              v-if="record.fields.Image && record.fields.Image.length"
              v-for="image in record.fields.Image"
              :key="image.id"
              :src="image.url"
              alt="Product image"
              class="w-full object-cover rounded-md mb-2"
            />
            <img
              v-if="!record.fields.Image || !record.fields.Image.length"
              src="https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png"
              alt="Fallback image"
              class="w-full object-cover rounded-md mb-2"
            />
          </div>

          <h3 class="text-m font-500 font-['DM_Sans']">
            {{ record.fields.Name }}
          </h3>
          <p
            v-if="record.fields.Price"
            class="text-m font-normal font-['DM_Sans']"
          >
            ${{ record.fields.Price }}
          </p>
          <p
            v-if="record.fields.Description"
            class="text-sm font-['DM_Sans'] font-200 mt-10"
          >
            {{ record.fields.Description }}
          </p>

          <div v-if="record.fields.Variants && record.fields.Variants.length">
            <template v-if="record.fields.Variants.length === 1">
              <p class="text-sm font-200 font-['DM_Sans']">
                Selected Variant: {{ record.fields.Variants[0].name }} - ${{
                  record.fields.Variants[0].price
                }}
              </p>
            </template>
            <template v-else>
              <label for="variantSelect">Choose a variant:</label>
              <select
                id="variantSelect"
                class="variant-dropdown text-sm font-100 font-['DM_Sans']"
                v-model="record.selectedVariant"
              >
                <option
                  v-for="variant in record.fields.Variants"
                  :key="variant.id"
                  :value="variant"
                  class="text-sm font-100 font-['DM_Sans']"
                >
                  {{ variant.name }} - ${{ variant.price }}
                </option>
              </select>
            </template>
          </div>

          <div class="flex-grow"></div>
          <!-- This div pushes the button to the bottom -->

          <FormKit
            type="button"
            label="Add to Cart"
            @click="addToCart(record)"
            class="add-to-cart-button font-['DM_Sans'] mt-auto"
          />
        </div>
      </div>
    </div>
    <div class="mt-5">
      <FormKit
        type="button"
        label="Back to Categories"
        @click="$emit('goBackToCategories')"
      />
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
  squareFootage: Number,
});

const airtableData = ref([]);
const isLoading = ref(false);
const cart = ref([]);
const notification = ref(null);

const emit = defineEmits(["updateCart"]);

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
          filterByFormula: `FIND('${props.category}', {Type})`,
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
                    duration: variant.fields.Duration,
                  }
                : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.price - b.price);

          if (record.fields.Variants.length === 1) {
            record.selectedVariant = record.fields.Variants[0];
          } else if (record.fields.Variants.length > 1) {
            // Set the first variant as the default selected variant
            record.selectedVariant = record.fields.Variants[0];
          }
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

  // Debugging logs to check the selected variant and product details

  const existingProductIndex = cart.value.findIndex(
    (item) =>
      item.id === product.id &&
      (!selectedVariant || item.selectedVariant?.id === selectedVariant.id)
  );

  if (existingProductIndex === -1) {
    // Product or variant not in the cart, add it
    cart.value.push({
      ...product,
      selectedVariant: selectedVariant || null,
    });

    notification.value = `${product.fields.Name} ${
      selectedVariant ? selectedVariant.name : ""
    } has been added to your cart!`;

    // Emit the updated cart to the parent component
    emit("updateCart", cart.value);
  } else {
    notification.value = `${product.fields.Name} ${
      selectedVariant ? selectedVariant.name : ""
    } is already in your cart.`;
  }

  // Hide the notification after 5 seconds
  setTimeout(() => {
    notification.value = null;
  }, 5000);
};

// Call fetch function when the component is mounted
fetchDataFromAirtable();
</script>

<style scoped>
.product-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.product-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  width: 250px;
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
  width: 100%;
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

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #000;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
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
