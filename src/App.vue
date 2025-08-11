<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  CheckIcon
} from 'lucide-vue-next';
import TextStatistics from './components/TextStatistics.vue';
import VoiceSelector from './components/VoiceSelector.vue';
import SpeedControl from './components/SpeedControl.vue';
import AudioChunk from './components/AudioChunk.vue';

// State variables
const text = ref(
    "Kitten TTS Nano is a lightweight text-to-speech model optimized for browser usage. It can run 100% locally in your browser, powered by Transformers.js!"
);
const lastGeneration = ref(null);
const isPlaying = ref(false);
const currentChunkIndex = ref(-1);
const speed = ref(1);
const copied = ref(false);
const status = ref("loading");
const error = ref(null);
const worker = ref(null);
const voices = ref(null);
const selectedVoice = ref("expr-voice-2-m");
const chunks = ref([]);
const result = ref(null);

// Computed properties
const processed = computed(() => {
  return lastGeneration.value &&
      lastGeneration.value.text === text.value &&
      lastGeneration.value.speed === speed.value &&
      lastGeneration.value.voice === selectedVoice.value;
});

// Methods
const setSelectedVoice = (voice) => {
  selectedVoice.value = voice;
};

const setSpeed = (newSpeed) => {
  speed.value = newSpeed;
};

const setCurrentChunkIndex = (index) => {
  currentChunkIndex.value = index;
};

const setIsPlaying = (playing) => {
  isPlaying.value = playing;
};

const handleChunkEnd = () => {
  if (status.value !== "generating" && currentChunkIndex.value === chunks.value.length - 1) {
    isPlaying.value = false;
    currentChunkIndex.value = -1;
  } else {
    currentChunkIndex.value = currentChunkIndex.value + 1;
  }
};

const handlePlayPause = () => {
  if (!isPlaying.value && status.value === "ready" && !processed.value) {
    status.value = "generating";
    chunks.value = [];
    currentChunkIndex.value = 0;
    const params = { text: text.value, voice: selectedVoice.value, speed: speed.value };
    lastGeneration.value = params;
    worker.value?.postMessage(params);
  }
  if (currentChunkIndex.value === -1) {
    currentChunkIndex.value = 0;
  }
  isPlaying.value = !isPlaying.value;
};

const downloadAudio = () => {
  if (!result.value) return;
  const url = URL.createObjectURL(result.value);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audio.wav";
  link.click();
  URL.revokeObjectURL(url);
}

const handleCopy = async () => {
  await navigator.clipboard.writeText(text.value);
  copied.value = true;
  setTimeout(() => { copied.value = false }, 2000);
}

// Worker setup
onMounted(() => {
  worker.value = new Worker(new URL("./workers/tts-worker.js", import.meta.url), {
    type: "module",
  });

  const onMessageReceived = ({ data }) => {
    switch (data.status) {
      case "device":
        break;
      case "ready":
        status.value = "ready";
        voices.value = data.voices;
        break;
      case "error":
        status.value = "error";
        error.value = data.data;
        break;
      case "stream":
        chunks.value = [...chunks.value, data.chunk];
        break;
      case "complete":
        status.value = "ready";
        result.value = data.audio;
        break;
    }
  };

  const onErrorReceived = (e) => {
    console.error("Worker error:", e);
    error.value = e.message;
  };

  worker.value.addEventListener("message", onMessageReceived);
  worker.value.addEventListener("error", onErrorReceived);
});

// Cleanup
onUnmounted(() => {
  if (worker.value) {
    worker.value.terminate();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 p-4">
    <div class="container mx-auto max-w-4xl">
      <div class="bg-white shadow-lg rounded-lg overflow-hidden">
        <div class="p-6">
          <div class="text-center mb-4">
            <div class="inline-flex items-center gap-2">
              <h1 class="text-3xl font-bold text-gray-900">😻 Kitten TTS Nano Demo</h1>
            </div>
            <p class="text-gray-500">
              Convert text to natural-sounding speech with Kitten TTS
            </p>
          </div>

          <div class="relative">
            <textarea
              v-model="text"
              placeholder="Type or paste your text here..."
              class="w-full transition-all min-h-[180px] text-lg leading-relaxed resize-y p-3 border text-gray-300 border-gray-300 rounded-lg"
            ></textarea>
            <button
              class="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              @click="handleCopy"
            >
              <CheckIcon v-if="copied" class="h-4 w-4" />
              <CopyIcon v-else class="h-4 w-4" />
            </button>
          </div>

          <div class="flex justify-end pt-2">
            <TextStatistics :text="text" />
          </div>

          <div class="flex gap-4 pb-4 min-h-14 items-center">
            <label for="voice-selector" class="font-bold">Voice:</label>
            <VoiceSelector
              v-if="voices"
              :voices="voices"
              :selected-voice="selectedVoice"
              @voice-change="setSelectedVoice"
            />
            <div v-else-if="error" class="text-red-400 font-semibold text-lg/6 text-center p-2">
              {{ error }}
            </div>
            <div v-else class="animate-pulse text-center">
              Loading model...
            </div>

            <div class="flex items-center gap-4 w-44" v-if="voices">
              <SpeedControl
                :speed="speed"
                @speed-change="setSpeed"
              />
            </div>
          </div>

          <hr class="my-4 border-gray-200" />

          <div class="flex py-4 gap-4">
            <button
              class="w-30 transition-all py-2 px-4 rounded-lg font-medium flex items-center justify-center"
              :class="{
                'bg-orange-600 hover:bg-orange-700 text-white': isPlaying,
                'bg-blue-600 hover:bg-blue-700 text-white': !isPlaying,
                'opacity-50 cursor-not-allowed': (status === 'ready' && !isPlaying && !text) || (status !== 'ready' && chunks.length === 0)
              }"
              @click="handlePlayPause"
              :disabled="(status === 'ready' && !isPlaying && !text) || (status !== 'ready' && chunks.length === 0)"
            >
              <PauseIcon v-if="isPlaying" class="mr-1 size-6" />
              <PlayIcon v-else class="mr-1 size-6" />
              <span v-if="isPlaying">Pause</span>
              <span v-else>{{ processed || status === 'generating' ? 'Play' : 'Generate' }}</span>
            </button>

            <button
              class="ml-auto py-2 px-4 rounded-lg font-medium flex items-center justify-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              @click="downloadAudio"
              :disabled="!result || status !== 'ready'"
              :class="{
                'opacity-50 cursor-not-allowed': !result || status !== 'ready'
              }"
            >
              <DownloadIcon class="mr-2 size-4" />
              Download Audio
            </button>
          </div>

          <AudioChunk
            v-if="chunks.length > 0"
            v-for="(chunk, index) in chunks"
            :key="index"
            :audio="chunk.audio"
            :active="currentChunkIndex === index"
            :playing="isPlaying"
            class="hidden"
            @start="() => setCurrentChunkIndex(index)"
            @pause="() => { if (currentChunkIndex === index) setIsPlaying(false) }"
            @end="handleChunkEnd"
          />
        </div>
      </div>
    </div>
  </div>
</template>
