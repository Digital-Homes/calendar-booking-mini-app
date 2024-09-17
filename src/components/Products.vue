<template>
  <div class="container">
    <!-- Step 1: Ask for User Information -->
    <div v-if="!stepCompleted">
      <h1>Enter your details</h1>
      <form @submit.prevent="goToStep2">
        <label for="name">Name:</label>
        <input v-model="userInfo.name" id="name" type="text" required />

        <label for="address">Address:</label>
        <input v-model="userInfo.address" id="address" type="text" required />

        <!-- Add more fields as needed -->
        <button type="submit">Next</button>
      </form>
    </div>

    <!-- Step 2: Category Selection and Product Display -->
    <div v-if="stepCompleted">
      <h1 v-if="!selectedCategory">Select a Service Category</h1>

      <!-- Category Cards -->
      <div v-if="!selectedCategory" class="category-cards">
        <div
          class="category-card"
          v-for="category in categories"
          :key="category"
          @click="selectCategory(category)"
        >
          <h2>{{ category }}</h2>
        </div>
      </div>

      <!-- Loader for Step 2: Loading products -->
      <div v-if="isLoading" class="loader">
        <p>Loading products...</p>
      </div>

      <!-- Display Products -->
      <div v-if="!isLoading && selectedCategory">
        <button @click="goBack" class="back-button">Back to Categories</button>
        <h2>Products for {{ selectedCategory }}</h2>

        <!-- Product Cards -->
        <div class="product-cards">
          <div
            class="product-card"
            v-for="record in airtableData"
            :key="record.id"
          >
            <!-- Images -->
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

            <!-- Product Details -->
            <p v-if="record.fields.Price">${{ record.fields.Price }}</p>
            <p v-if="record.fields.Description">
              {{ record.fields.Description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Ref to store selected category, categories, Airtable data, and loading state
const selectedCategory = ref('');
const categories = ref<string[]>([]); // Categories pulled from Airtable
const airtableData = ref([]);
const isLoading = ref(false); // Loading state for products
const stepCompleted = ref(false); // Track whether step 1 is completed
const userInfo = ref({
  name: '',
  address: '',
});

// Airtable API setup
const airtableBaseId = 'appVlfJAA3DuNMkAH';
const airtableTableName = 'tbllibhVR3ACwhCL0';
const airtableToken =
  'pat1IRjmIY2yqPy96.5835cd05ae22982911d4b1a520475cb1802a5907ec7c7ed173dd400441933817';

// Fetch categories from Airtable
const fetchCategoriesFromAirtable = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
      }
    );

    const records = response.data.records;
    const typesSet = new Set<string>();

    records.forEach((record) => {
      if (record.fields.Type) {
        record.fields.Type.forEach((type: string) => {
          typesSet.add(type);
        });
      }
    });

    categories.value = Array.from(typesSet);
  } catch (error) {
    console.error('Error fetching categories from Airtable:', error);
  }
};

// Fetch data for selected category
const fetchDataFromAirtable = async (category: string) => {
  isLoading.value = true; // Show the loader while data is being fetched
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
        params: {
          filterByFormula: `FIND('${category}', {Type})`,
        },
      }
    );
    airtableData.value = response.data.records;
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  } finally {
    isLoading.value = false; // Hide the loader after the data is fetched
  }
};

// Handle category selection
const selectCategory = (category: string) => {
  selectedCategory.value = category;
  fetchDataFromAirtable(category);
};

// Handle step 1 submission
const goToStep2 = () => {
  stepCompleted.value = true;
};

// Go back to category selection
const goBack = () => {
  selectedCategory.value = '';
  airtableData.value = []; // Clear the products data when going back
};

// Fetch categories on component mount
onMounted(() => {
  fetchCategoriesFromAirtable();
});
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
}

.category-card {
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  text-align: center;
  width: 250px;
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: scale(1.05);
}

.product-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-around;
}

.product-card {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: scale(1.05);
}

.product-images {
  display: flex;
  gap: 10px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 5px;
}

.back-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
}

.back-button:hover {
  background-color: #0056b3;
}

.loader {
  text-align: center;
  margin: 40px 0;
  font-size: 18px;
}
</style>
