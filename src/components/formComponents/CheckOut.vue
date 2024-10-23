<template>
  <div>
    <div class="form-group font-['DM_Sans']">
      <label>Property Location</label>
      <input type="text" :value="props.location" class="input-field" readonly />
    </div>

    <div class="form-group">
      <label>Service</label>
      <div class="service-box">
        <input
          type="text"
          :value="productNamesString"
          class="input-field"
          readonly
        />
      </div>
    </div>

    <div class="form-group">
      <label>Appointment</label>
      <div
        class="flex p-4 bg-pink-50 border-2 border-pink-300 rounded-lg shadow-sm mt-5"
      >
        <span class="appointment-details">
          <h3 class="text-[#EB36C5]">
            Photographer: {{ props.photographer }} Date:
            {{ props.appointment.date }} Hour: {{ props.appointment.time }}
          </h3>
        </span>
      </div>
    </div>

    <div class="form-group">
      <label>Notes</label>
      <textarea class="input-field" :value="props.notes" readonly></textarea>
    </div>

    <div class="form-group">
      <label>Coupon Code</label>
      <div class="coupon-box">
        <input type="text" class="input-field" placeholder="Coupon" />
        <button class="apply-button">Apply</button>
      </div>
    </div>

    <div class="total-section">
      <span>Total: </span>
      <span class="text-[#eb36c5]">${{ props.total }}</span>
    </div>

    <div class="buttons">
      <button class="prev-button">Prev Step</button>
      <button @click="handleCheckout" class="checkout-button">Checkout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, defineEmits } from "vue";

const emit = defineEmits(["placeOrder"]);

// Define the props with their types
const props = defineProps({
  selectedProducts: {
    type: Array,
  },
  location: {
    type: String,
  },
  appointment: {
    type: Object,
  },
  notes: {
    type: String,
  },
  photographer: {
    type: String,
  },
  total: {
    type: Number,
  },
});

// Compute product names string
const productNamesString = computed(() => {
  // Extracting product names and joining them as a string
  return props.selectedProducts
    .map((product) => product.fields.Name)
    .join(", ");
});

const handleCheckout = () => {
  emit("placeOrder", true); // Emit the placeOrder event with value true
};
</script>

<style scoped>
.checkout-form {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
}

.input-field {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.service-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-more {
  color: #c874db;
  text-decoration: none;
}

.appointment-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.appointment-details {
  display: flex;
  flex-direction: column;
}

.change-appointment {
  color: #c874db;
  text-decoration: none;
}

.coupon-box {
  display: flex;
}

.apply-button {
  margin-left: 10px;
  padding: 10px 20px;
  background-color: #eaeaea;
  border: none;
  border-radius: 50px;
}

.total-section {
  display: flex;
  justify-content: flex-start;
  margin-top: 20px;
}

.total-section span {
  margin-right: 10px; /* Adds space between "Total:" and the price */
}

.total-price {
  color: #c874db;
  font-weight: bold;
}

.buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.prev-button {
  padding: 10px 20px;
  background-color: #eaeaea;
  border: none;
  border-radius: 50px;
}

.checkout-button {
  padding: 10px 20px;
  background-color: #eb36c5;
  color: white;
  border: none;
  border-radius: 50px;
}
</style>
