import { KittenTTS, TextSplitterStream } from "../lib/kitten-tts.js";
import { detectWebGPU } from "../utils/utils.js";

// Device detection
let device = (await detectWebGPU()) ? "webgpu" : "wasm";
device = "wasm"; // webgpu still isn't sounding quite right
self.postMessage({ status: "device", device });

// Load the model
const model_path = "/tts-model/model_quantized.onnx";
const tts = await KittenTTS.from_pretrained(model_path, {
  dtype: "q8",
  device,
}).catch((e) => {
  console.error("Error loading model:", e);
  self.postMessage({ status: "error", data: e.message });
  throw e;
});
self.postMessage({ status: "ready", voices: tts.voices, device });

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  const { text, voice, speed } = e.data;
  const streamer = new TextSplitterStream();

  streamer.push(text);
  streamer.close(); // Indicate we won't add more text

  const stream = tts.stream(streamer, { voice, speed });
  const chunks = [];

  try {
    for await (const { text, audio } of stream) {
      self.postMessage({
        status: "stream",
        chunk: {
          audio: audio.toBlob(),
          text,
        },
      });
      chunks.push(audio);
    }
  } catch (error) {
    console.error("Error during streaming:", error);
    self.postMessage({ status: "error", data: error.message });
    return;
  }

  // Merge chunks
  let audio;
  if (chunks.length > 0) {
    try {
      const sampling_rate = chunks[0].sampling_rate;
      const length = chunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
      const waveform = new Float32Array(length);
      let offset = 0;
      for (const { audio } of chunks) {
        waveform.set(audio, offset);
        offset += audio.length;
      }

      // Create a new merged RawAudio
      // @ts-expect-error - So that we don't need to import RawAudio
      audio = new chunks[0].constructor(waveform, sampling_rate);
    } catch (error) {
      console.error("Error merging audio chunks:", error);
      self.postMessage({ status: "error", data: error.message });
      return;
    }
  }

  self.postMessage({ status: "complete", audio: audio?.toBlob() });
});
