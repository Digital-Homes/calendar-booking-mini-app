<template>
  <div class="mx-auto my-16 max-w-[768px]">
    <img
      src="/digitalhomes.svg"
      alt="Digital Homes logo"
      class="w-60 mx-auto mb-8"
    />

    <!-- Display Total Items and Total Price -->
    <div v-if="totalItems > 0" class="cart-summary">
      <h3>Total Items: {{ totalItems }}</h3>
      <h3>Total Price: ${{ totalPrice.toFixed(2) }}</h3>
    </div>

    <!-- Add this after your ProductList and AddOnSelection components -->
    <button
      v-if="showNextButton"
      @click="handleNext"
      class="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
    >
      Next
    </button>

    <!-- Service selection step -->
    <FormSelectionStep
      v-if="!serviceSelected"
      @serviceSelected="handleServiceSelected"
    />

    <!-- Email verification step -->
    <EmailStep
      v-if="serviceSelected && !stepCompleted"
      @emailChecked="handleEmailChecked"
    />

    <!-- Property information step (shown only if service is appointment) -->
    <PropertyInfoStep
      v-if="
        serviceSelected === 'appointment' &&
        stepCompleted &&
        !propertyInfoSubmitted
      "
      @propertyInfoSubmitted="handlePropertyInfoSubmitted"
    />

    <!-- Editing style step (shown only if service is editing) -->
    <!-- <EditingStyleStep
      v-if="
        serviceSelected === 'editing' && stepCompleted && !editingStyleSubmitted
      "
      @styleSelected="handleEditingStyleSelected"
    /> -->

    <!-- Property status step (for appointment service) -->
    <PropertyStatusStep
      v-if="
        serviceSelected === 'appointment' &&
        stepCompleted &&
        propertyInfoSubmitted &&
        !propertyStatusSubmitted
      "
      @propertyStatusSubmitted="handlePropertyStatusSubmitted"
    />

    <!-- Category selection step (for both services) -->
    <CategorySelectionStep
      v-if="propertyStatusSubmitted && !categorySelectionSubmitted"
      @categorySelected="handleCategorySelected"
    />

    <!-- Product list and add-on components based on the selected category -->
    <ProductList
      v-if="
        propertyStatusSubmitted &&
        categorySelectionSubmitted &&
        !addOnSelectionStep
      "
      :category="selectedCategory"
      :squareFootage="propertyInfo.squareFootage"
      @goBackToCategories="handleGoBackToCategories"
      @updateCart="handleCartUpdate"
    />

    <AddOnSelection
      v-if="addOnSelectionStep"
      @goBack="addOnSelectionStep = false"
      :selectedProducts="selectedProducts"
      @addToCart="updateCart"
    />

    <ChoosePhotographerStep
      v-if="showChoosePhotographerStep"
      @photographerSelected="handlePhotographerSelected"
    />

    <!-- Future steps will be placed here -->
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits } from "vue";
import EmailStep from "./formComponents/EmailStep.vue";
import FormSelectionStep from "./formComponents/FormSelectionStep.vue";
import PropertyInfoStep from "./formComponents/PropertyInfoStep.vue";
import PropertyStatusStep from "./formComponents/PropertyStatusStep.vue";
import CategorySelectionStep from "./formComponents/CategorySelectionStep.vue";
import ProductList from "./formComponents/ProductList.vue";
import AddOnSelection from "./formComponents/AddOnSelection.vue";
import ChoosePhotographerStep from "./formComponents/ChoosePhotographerStep.vue";

const stepCompleted = ref(false);
const userInfo = ref({ email: "", name: "" });
const serviceSelected = ref(null);
const propertyInfo = ref({
  location: "",
  squareFootage: 0, // Initialize as a number
  notes: "",
});
const propertyInfoSubmitted = ref(false);
const propertyStatusSubmitted = ref(false);
const categorySelectionSubmitted = ref(false);
const selectedCategory = ref("");
const selectedProducts = ref([]);
const addOnSelectionStep = ref(false);
const showNextButton = ref(false);
const cart = ref({
  items: [],
  totalPrice: 0,
});

const emit = defineEmits(["updateCart"]);

const handleEmailChecked = (data) => {
  userInfo.value.email = data.email;
  userInfo.value.name = data.name;
  stepCompleted.value = true;
};

const handleServiceSelected = (service) => {
  serviceSelected.value = service;
  stepCompleted.value = false; // Reset to show the email step
};

const handlePropertyInfoSubmitted = (info) => {
  propertyInfo.value = {
    location: info.location,
    squareFootage: parseFloat(info.squareFootage), // Convert to number if it's a string
    notes: info.notes,
  };
  propertyInfoSubmitted.value = true;
};

const handlePropertyStatusSubmitted = (propertyStatus) => {
  // Handle the property status here
  propertyStatusSubmitted.value = true;
};

const handleCategorySelected = (category) => {
  selectedCategory.value = category; // Add this line to store the selected category
  categorySelectionSubmitted.value = true;
};

const handleGoBackToCategories = () => {
  // Reset the state for category selection
  categorySelectionSubmitted.value = false;
  selectedCategory.value = "";
  // You can also reset any other states if necessary
};

const handleNext = () => {
  if (hasAddOns.value) {
    addOnSelectionStep.value = true; // Show AddOnSelection if there are add-ons
  } else {
    // Here you should set the state to show the "Choose Photographer" step
    // For example:
    // showChoosePhotographerStep.value = true;
    console.log("Proceeding to Choose Photographer Step");
  }
};

// const handleEditingStyleSelected = (style) => {
//   selectedEditingStyle.value = style;
//   editingStyleSubmitted.value = true; // Mark step as completed after choosing editing style
// };

const totalPrice = computed(() => {
  return cart.value.totalPrice; // Calculate total price based on items in cart
});
const totalItems = computed(() => cart.value.items.length);

// const updateCart = (addOn) => {
//   // Check if the add-on is already in the cart
//   const existingAddOn = cart.value.items.find((item) => item.id === addOn.id);

//   if (!existingAddOn) {
//     cart.value.items.push(addOn); // Add new add-on to the cart
//   }

//   cart.value.totalPrice += addOn.fields.Price; // Update total price
// };

const updateCart = (addOn) => {
  // Check if the add-on is already in the cart
  const existingAddOn = cart.value.items.find((item) => item.id === addOn.id);

  if (!existingAddOn) {
    cart.value.items.push(addOn); // Add new add-on to the cart
  }

  // Update the total price
  cart.value.totalPrice += addOn.fields.Price;

  emit("updateCart", cart.value.items); // Emit the updated cart

  // Show the Next button if the cart has items
  if (cart.value.items.length > 0) {
    showNextButton.value = true;
  }

  // Log for debugging
  console.log("Add-on added to cart:", addOn);
  console.log("Current cart items after add-on:", cart.value.items);
};

const hasAddOns = computed(() => {
  const hasAddOnsValue = cart.value.items.some(
    (product) =>
      product.fields["Add-ons"] && product.fields["Add-ons"].length > 0
  );

  // Log the current value of hasAddOns
  console.log("Checking for add-ons:", hasAddOnsValue);
  return hasAddOnsValue;
});

const handleCartUpdate = (updatedCartItems) => {
  cart.value.items = updatedCartItems; // Set the new items from the updated cart
  cart.value.totalPrice = updatedCartItems.reduce((total, item) => {
    const price = item.selectedVariant
      ? parseFloat(item.selectedVariant.Price)
      : parseFloat(item.fields.Price);
    return total + (!isNaN(price) ? price : 0);
  }, 0);

  // Check if the cart has add-ons after updating
  if (hasAddOns.value) {
    showNextButton.value = true;
    // addOnSelectionStep.value = true; // Show the AddOnSelection component if there are add-ons
  } else {
    showNextButton.value = false; // Hide if there are no add-ons
  }

  // Log the current cart items and total price
  console.log("Updated cart items:", cart.value.items);
  console.log("Updated total price:", cart.value.totalPrice);
};

watch(selectedProducts, (newVal) => {
  // Emit an updateCart event whenever the selected products change
  emit("updateCart", newVal);
});

const chooseAddOns = () => {
  addOnSelectionStep.value = true; // Show the AddOnSelection component
};
</script>

<style scoped>
/* Global styles for the multi-step form */
</style>
