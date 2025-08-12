<script setup>
import { ref } from 'vue';

const emit = defineEmits(['sample-rate-change']);

const selectedSampleRate = ref(24000);

const sampleRates = [
  { value: 8000, label: '8 kHz' },
  { value: 16000, label: '16 kHz' },
  { value: 22050, label: '22.05 kHz' },
  { value: 24000, label: '24 kHz (Native)' },
  { value: 44100, label: '44.1 kHz' },
  { value: 48000, label: '48 kHz' }
];

const handleSampleRateChange = () => {
  emit('sample-rate-change', selectedSampleRate.value);
};
</script>

<template>
  <div class="flex items-center gap-2">
    <label for="sample-rate" class="font-bold text-sm">Sample Rate:</label>
    <select
      id="sample-rate"
      v-model="selectedSampleRate"
      @change="handleSampleRateChange"
      class="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option v-for="rate in sampleRates" :key="rate.value" :value="rate.value">
        {{ rate.label }}
      </option>
    </select>
  </div>
</template>
