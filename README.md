# 😻 Kitten TTS Web Demo

A web-based demo of the **Kitten TTS Nano** model - a lightweight 15M parameter text-to-speech model running entirely in your browser using ONNX Runtime and transformers.js! [Try the demo here](https://clowerweb.github.io/kitten-tts-web-demo/).

## ✨ Features

- 🎤 **8 Different Voices** - Male and female expression voices
- ⚡ **Adjustable Speed** - From 0.5x (slow) to 2.0x (fast)  
- 🎵 **Multiple Sample Rates** - 8kHz to 48kHz for different quality levels
- 🌐 **100% Browser-Based** - No server required, runs locally
- 📱 **Real-time Generation** - Fast inference using WebAssembly
- 🚀 **WebGPU Support** - Experimental WebGPU acceleration (with WASM fallback)

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/clowerweb/kitten-tts-web-demo
   cd kitten-tts-web-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

5. **Type some text and generate speech!** 🎉

## 📋 Requirements

- Node.js 16+
- Modern browser with WebAssembly support
- ~50MB disk space for model files

## 🏗️ How It Works

This demo replicates the Kitten TTS pipeline in JavaScript.

## 🎛️ Controls

- **Voice Selection** - Choose from 8 different voice embeddings
- **Speed Control** - Adjust speech rate (0.5x - 2.0x)
- **Sample Rate** - Select audio quality (16kHz - 48kHz)
- **WebGPU Toggle** - Enable experimental GPU acceleration

## 📦 Model Information

This demo uses the **Kitten TTS Nano v0.1** model:
- **Size:** ~24MB ONNX model (quantized)
- **Parameters:** 15 million
- **Quality:** High-quality speech synthesis
- **Speed:** ~2-3x Real-time generation in browser

**Original Model:**
- 📁 **GitHub:** [KittenML/KittenTTS](https://github.com/KittenML/KittenTTS)
- 🤗 **Hugging Face:** [KittenML/kitten-tts-nano-0.1](https://huggingface.co/KittenML/kitten-tts-nano-0.1)

## 🛠️ Technical Stack

- **Frontend:** Vue 3 + Vite
- **ML Runtime:** ONNX Runtime Web (WebGPU + WASM)
- **Phonemization:** phonemizer.js (espeak backend)
- **Audio Processing:** Web Audio API
- **Text Processing:** Custom text cleaner with smart chunking
- **Model Format:** ONNX + JSON voice embeddings

## 📁 Project Structure

```
├── index.html              # Main HTML entry point
├── src/
│   ├── App.vue             # Main Vue application
│   ├── main.js             # Application entry point
│   ├── components/         # Vue components
│   │   ├── AudioChunk.vue  # Audio playback component
│   │   ├── SampleRateSelector.vue
│   │   ├── SpeedControl.vue
│   │   ├── TextStatistics.vue
│   │   ├── ThemeToggle.vue
│   │   ├── VoiceSelector.vue
│   │   └── WebGPUToggle.vue # GPU acceleration toggle
│   ├── lib/
│   │   └── kitten-tts.js   # Core TTS implementation
│   ├── utils/
│   │   ├── model-cache.js  # Model caching utilities
│   │   ├── text-cleaner.js # Text processing & chunking
│   │   └── utils.js        # General utilities
│   └── workers/
│       └── tts-worker.js   # Web Worker for TTS
├── public/
│   ├── onnx-runtime/       # ONNX Runtime WASM files
│   └── tts-model/          # Model files
│       ├── model_quantized.onnx
│       ├── tokenizer.json
│       └── voices.json     # Voice embeddings
├── package.json            # Dependencies
└── vite.config.js          # Vite configuration
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features  
- Submit pull requests
- Improve documentation

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

The Kitten TTS model is also licensed under Apache 2.0 by [KittenML](https://github.com/KittenML).

## 🙏 Acknowledgments

- **KittenML Team** for creating the amazing Kitten TTS model
- **Xenova** for transformers.js and ONNX Runtime Web integration
- **espeak** for phonemization support

## 🐛 Troubleshooting

**Model not loading?**
- Check browser console for CORS or network errors

**Audio not playing?**
- Try different browsers (Chrome/Firefox recommended)
- Check if audio autoplay is blocked
- Verify audio permissions

**Poor audio quality?**
- Try different voices
- Adjust sample rate settings
- Use shorter text inputs for better quality

**WebGPU not working?**
- This is an experimental feature and is known not to work in some browser/GPU setups. We are looking for contributors to help with better WebGPU support.

---

Made with ❤️ using the Kitten TTS Nano model. Meow! 😻
