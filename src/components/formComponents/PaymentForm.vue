<template>
  <div>
    <!-- Form Fields in Two Columns -->
    <div class="form-grid font-['DM_Sans']">
      <!-- Column 1 -->
      <div>
        <FormKit
          type="text"
          name="first-name"
          label="First Name"
          placeholder="First Name"
          class="rounded-[6px]"
        />
        <FormKit
          type="email"
          name="email"
          label="Email"
          placeholder="Email"
          class="rounded-[6px]"
        />
        <FormKit
          type="password"
          name="password"
          label="Create Password"
          placeholder="Password"
          class="rounded-[6px]"
        />
        <FormKit
          type="text"
          name="card-number"
          label="Card Number"
          placeholder="1234 5678 9012 3456"
          class="input-field"
        />
        <FormKit
          type="select"
          name="exp-month"
          label="Expiration Month"
          :options="months"
        />
      </div>

      <!-- Column 2 -->
      <div>
        <FormKit
          type="text"
          name="last-name"
          label="Last Name"
          placeholder="Last Name"
        />
        <FormKit
          type="email"
          name="confirm-email"
          label="Confirm Email"
          placeholder="Confirm Email"
        />
        <FormKit
          type="tel"
          name="phone-number"
          label="Phone Number"
          placeholder="Phone Number"
        />
        <FormKit type="text" name="cvc" label="CVC" placeholder="CVC" />
        <FormKit
          type="select"
          name="exp-year"
          label="Expiration Year"
          :options="years"
        />
      </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-section">
      <FormKit
        type="checkbox"
        name="terms"
        label="I agree to the terms and conditions"
      />
    </div>

    <!-- Total and Pay Now button -->
    <div class="total-pay-section">
      <span class="">Total: ${{ props.total }}</span>
      <button class="pay-now-button">Pay Now</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
  total: {
    type: Number,
  },
});

const months = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const years = Array.from({ length: 10 }, (_, i) => {
  const currentYear = new Date().getFullYear();
  return { label: currentYear + i, value: currentYear + i };
});
</script>

<style scoped>
.payment-form {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.terms-section {
  margin-top: 20px;
}

.total-pay-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.input-field {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.total {
  font-size: 18px;
}

.pay-now-button {
  padding: 10px 20px;
  background-color: #eb36c5;
  color: white;
  border: none;
  border-radius: 50px;
}
</style>

<script setup></script>
