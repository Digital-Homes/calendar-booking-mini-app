<template>
  <div>
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center min-h-screen"
    >
      <div class="spinner"></div>
      <h2 class="font-['DM_Sans']">Loading products</h2>
    </div>
    <div class="mt-5 mx-auto flex flex-col items-start max-w-[1050px]">
      <FormKit
        type="button"
        label="Back to Categories"
        @click="$emit('goBackToCategories')"
      />
    </div>

    <div v-if="!isLoading && airtableData.length">
      <h2
        class="text-xl mb-4 font-['DM_Sans'] flex flex-col items-center justify-center mt-20"
      >
        Choose Your Service
      </h2>

      <div class="product-cards flex flex-row items-center justify-center">
        <label
          v-for="record in airtableData"
          :key="record.id"
          class="product-card h-300 relative flex flex-col items-center justify-between"
          :class="{ 'selected-card': isSelected(record) }"
        >
          <input
            type="radio"
            :value="record"
            v-model="selectedProduct"
            @change="addToCart(record)"
            class="absolute top-2 right-2 radio-button"
          />

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
        </label>
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
  squareFootage: Number,
});

const airtableData = ref([]);
const isLoading = ref(false);
const cart = ref([]);
const selectedProduct = ref(null); // Track selected product

const emit = defineEmits(["updateCart"]);

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

  const existingProductIndex = cart.value.findIndex(
    (item) =>
      item.id === product.id &&
      (!selectedVariant || item.selectedVariant?.id === selectedVariant.id)
  );

  if (existingProductIndex === -1) {
    cart.value.push({
      ...product,
      selectedVariant: selectedVariant || null,
    });

    emit("updateCart", cart.value);
  } else {
  }
};

const isSelected = (record) => {
  return selectedProduct.value === record;
};

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
  text-align: center;
  background-color: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  width: 250px;
  height: 350px;
  /* other existing styles */
}

.selected-card {
  border-color: #ff33cc; /* Border color for selected card */
}

.radio-button {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #ff33cc;
  border-radius: 50%;
  outline: none;
}

.radio-button:checked {
  background-color: #ff33cc;
}

.variant-dropdown {
  background-size: 12px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  font-size: 0.9rem;
  margin-top: 10px;
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
