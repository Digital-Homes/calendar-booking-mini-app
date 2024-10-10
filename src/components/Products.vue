<template>
  <div class="container">
    <!-- Step 1: Ask for User Email -->
    <div v-if="!stepCompleted">
      <h1>What's your email?</h1>
      <p>Note: Please use the same email every time.</p>
      <form @submit.prevent="checkEmail">
        <label for="email">Email:</label>
        <input v-model="userInfo.email" id="email" type="email" required />
        <button type="submit">Next</button>
      </form>
    </div>

    <!-- Step 2: Property Information -->
    <div v-if="stepCompleted && !propertyInfoSubmitted">
      <h1 v-if="userInfo.name">Welcome back, {{ userInfo.name }}!</h1>
      <h1 v-else>Welcome to Digital Homes!</h1>
      <h2>Property Information</h2>

      <form @submit.prevent="submitPropertyInfo">
        <label for="location">Property Location:</label>
        <input
          v-model="propertyInfo.location"
          @input="fetchLocationSuggestions"
          id="location"
          type="text"
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

        <label for="squareFootage">Square Footage:</label>
        <input
          v-model="propertyInfo.squareFootage"
          id="squareFootage"
          type="number"
          required
        />

        <label for="notes"
          >Do you have any specific notes or requests about this
          property?</label
        >
        <textarea v-model="propertyInfo.notes" id="notes"></textarea>

        <button type="submit">Next</button>
      </form>
    </div>

    <!-- Step 3: Property Status -->
    <div v-if="propertyInfoSubmitted && !propertyStatusSubmitted">
      <h1>Check Property Status</h1>
      <form @submit.prevent="submitPropertyStatus">
        <label
          ><input type="checkbox" v-model="propertyStatus.ownerOccupied" />
          Owner Occupied</label
        >
        <label
          ><input type="checkbox" v-model="propertyStatus.tenantOccupied" />
          Tenant Occupied</label
        >
        <label
          ><input type="checkbox" v-model="propertyStatus.vacant" />
          Vacant</label
        >
        <label
          ><input type="checkbox" v-model="propertyStatus.furnishedOrStaged" />
          Furnished or Staged</label
        >
        <label
          ><input type="checkbox" v-model="propertyStatus.unfurnished" />
          Unfurnished</label
        >
        <label
          ><input type="checkbox" v-model="propertyStatus.commercialProperty" />
          Commercial Property</label
        >
        <button type="submit">Next</button>
      </form>
    </div>

    <!-- Step 4: Category Selection -->
    <div v-if="propertyStatusSubmitted && !categorySelectionSubmitted">
      <h2>Select a Service Category</h2>

      <div class="category-cards">
        <div
          class="category-card"
          v-for="category in categories"
          :key="category.name"
          @click="selectCategory(category.name)"
        >
          <img
            :src="category.image"
            alt="Category image"
            class="category-image"
          />
          <h2>{{ category.name }}</h2>
        </div>
      </div>
    </div>

    <!-- Step 5: Display Products for the Selected Category -->
    <div v-if="categorySelectionSubmitted && selectedCategory">
      <button @click="goBack" class="back-button">Back to Categories</button>
      <h2>Products for {{ selectedCategory }}</h2>
      <button @click="checkForAddOns" v-if="cart.length > 0">Next</button>

      <div>
        <span>Products Selected: {{ selectedCount }}</span>
        <span>Total Price: ${{ totalPrice.toFixed(2) }}</span>
        <div v-if="showNotification" class="notification">
          {{ notification }}
        </div>
      </div>

      <div v-if="isLoading" class="loader">
        <p>Loading products...</p>
      </div>

      <!-- Display Products -->
      <div v-if="!isLoading && airtableData.length">
        <div class="product-cards">
          <div
            class="product-card"
            v-for="record in airtableData"
            :key="record.id"
          >
            Images
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

            Variants Dropdown
            <div v-if="record.fields.Variants && record.fields.Variants.length">
              <label for="variants">Choose a variant:</label>
              <select
                v-model="record.selectedVariant"
                id="variants"
                @change="updatePrice(record)"
              >
                <option
                  v-for="variant in record.fields.Variants"
                  :key="variant.id"
                  :value="variant"
                >
                  {{ variant.name }}
                </option>
              </select>
              <p v-if="record.selectedVariant">
                Price: ${{ record.selectedVariant.price }}
              </p>
            </div>
            <button @click="addToCart(record)">Add</button>
          </div>
        </div>
      </div>

      <div v-if="!isLoading && !airtableData.length">
        <p>No products found for the selected category.</p>
      </div>
    </div>

    <!-- Add-Ons Section -->
    <div v-if="displayAddOnsSection">
      <h2>Add-Ons Available:</h2>
      <ul>
        <li v-for="addOn in uniqueAddOns" :key="addOn">{{ addOn }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const selectedCategory = ref("");
const airtableData = ref([]);
const isLoading = ref(false);
const stepCompleted = ref(false);
const propertyInfoSubmitted = ref(false);
const propertyStatusSubmitted = ref(false);
const categorySelectionSubmitted = ref(false);

const userInfo = ref({ email: "", name: "" });
const propertyInfo = ref({ location: "", squareFootage: "", notes: "" });
const locationSuggestions = ref([]);
const propertyStatus = ref({
  ownerOccupied: false,
  tenantOccupied: false,
  vacant: false,
  furnishedOrStaged: false,
  unfurnished: false,
  commercialProperty: false,
});
const cart = ref([]);
const selectedCount = computed(() => cart.value.length);
const notification = ref("");
const showNotification = ref(false);
const totalPrice = computed(() => {
  return cart.value.reduce((total, item) => total + item.price, 0);
});
const uniqueAddOns = ref([]);
const displayAddOnsSection = ref(false);

const categories = ref([
  {
    name: "Individual Services",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
  {
    name: "Bundled Services",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
  {
    name: "Luxury & Interior Design",
    image:
      "https://res.cloudinary.com/digital-homes/image/upload/v1726770736/logo.png",
  },
]);

const airtableBaseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const airtableTableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
const airtableToken = import.meta.env.VITE_AIRTABLE_TOKEN;
const agentTableName = import.meta.env.VITE_AGENT_TABLE_NAME;

const checkEmail = async () => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${agentTableName}`,
      {
        headers: { Authorization: `Bearer ${airtableToken}` },
        params: { filterByFormula: (Email = `${userInfo.value.email}`) },
      }
    );
    const records = response.data.records;
    if (records.length > 0) {
      userInfo.value.name = records[0].fields["Full Name"];
      stepCompleted.value = true;
    } else {
      userInfo.value.name = "";
      stepCompleted.value = true;
    }
  } catch (error) {
    console.error("Error checking email in Airtable:", error);
  }
};

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
  locationSuggestions.value = [];
};

const submitPropertyInfo = () => {
  propertyInfoSubmitted.value = true;
};

const submitPropertyStatus = () => {
  propertyStatusSubmitted.value = true;
};

const selectCategory = (category) => {
  selectedCategory.value = category;
  categorySelectionSubmitted.value = true;
  fetchDataFromAirtable(category);
};

const addToCart = (record) => {
  const selectedVariant = record.selectedVariant;
  if (record.fields.Variants && !selectedVariant) {
    // Only show alert if the product has variants and none is selected
    alert("Please select a variant.");
  } else {
    cart.value.push({
      productId: record.id,
      productName: record.fields.Name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      price: selectedVariant.price, // Use the price from the selected variant
    });

    // Show notification
    notification.value = `${record.fields.Name} (Variant: ${selectedVariant.name}) added to cart!`;
    showNotification.value = true;

    // Hide notification after 5 seconds
    setTimeout(() => {
      showNotification.value = false;
      notification.value = ""; // Clear the message
    }, 5000);
  }
};

// Fetch data for selected category
const fetchDataFromAirtable = async (category) => {
  isLoading.value = true; // Show the loader while data is being fetched
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`,
      {
        headers: {
          Authorization: `Bearer ${airtableToken}`,
        },
        params: {
          filterByFormula: FIND("${category}", { Type }),
        },
      }
    );

    // Fetch records and include linked variants
    airtableData.value = await Promise.all(
      response.data.records.map(async (record) => {
        if (record.fields.Variants && record.fields.Variants.length) {
          // Fetch linked variant records
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

          // Get user's square footage input
          const userSquareFootage = parseFloat(
            propertyInfo.value.squareFootage
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

              // Check if the user's square footage falls within the variant's min and max range
              const isValidVariant =
                (minSquareFeet === null ||
                  userSquareFootage >= minSquareFeet) &&
                (maxSquareFeet === null || userSquareFootage <= maxSquareFeet);

              return isValidVariant
                ? {
                    id: variant.id,
                    name: variant.fields.Name,
                    price: variant.fields.Price,
                  }
                : null;
            })
            .filter(Boolean); // Remove null values
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

const updatePrice = (record) => {
  const selectedVariant = record.selectedVariant;
  console.log(selectedVariant);
  if (selectedVariant) {
    record.fields.Price = selectedVariant.price; // Assuming price is part of the variant
  }
};

const checkForAddOns = () => {
  const addOnSet = new Set(); // Use a Set to ensure uniqueness of add-ons
  cart.value.forEach((item) => {
    const product = airtableData.value.find(
      (record) => record.id === item.productId
    );
    if (product && product.fields.AddOns) {
      product.fields.AddOns.forEach((addOn) => {
        addOnSet.add(addOn); // Add to the set to avoid duplicates
      });
    }
  });

  uniqueAddOns.value = Array.from(addOnSet); // Convert set to array for display
  displayAddOnsSection.value = uniqueAddOns.value.length > 0; // Show add-ons if they exist
};

const fetchUniqueAddOns = () => {
  const addOnSet = new Set();
  cart.value.forEach((item) => {
    const product = airtableData.value.find(
      (record) => record.id === item.productId
    );
    if (product && product.fields.AddOns) {
      product.fields.AddOns.forEach((addOn) => {
        addOnSet.add(addOn); // Add to set to ensure uniqueness
      });
    }
  });
  uniqueAddOns.value = Array.from(addOnSet); // Convert set to array for display
};

const goBack = () => {
  categorySelectionSubmitted.value = false;
  selectedCategory.value = "";
  airtableData.value = [];
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get("email");
  if (emailParam) {
    userInfo.value.email = emailParam;
    checkEmail();
  }
  fetchUniqueAddOns();
});
</script>

<style scoped>
@import "../assets/main.css";
</style>
