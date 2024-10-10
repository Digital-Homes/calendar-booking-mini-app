<template>
  <div>
    <div v-if="isLoading">Loading products...</div>
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
        </div>
      </div>
    </div>
    <div v-if="!isLoading && airtableData.length === 0">No products found.</div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const serviceTable = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;

const props = defineProps({
  category: String,
  squareFootage: Number, // Pass squareFootage as a prop
});

const airtableData = ref([]);
const isLoading = ref(false);

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
        if (record.fields.Variants && record.fields.Variants.length) {
          const variantIds = record.fields.Variants.join(",");
          const variantResponse = await axios.get(
            `https://api.airtable.com/v0/${airtableBaseId}/Variants`,
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
</style>
