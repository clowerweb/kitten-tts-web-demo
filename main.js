// Use ONNX Runtime directly for the Kitten TTS model
import * as ort from 'onnxruntime-web';
import { phonemize } from 'phonemizer';

// Configure ONNX Runtime
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';

let session = null;
let voices = null;
const statusEl = document.getElementById('status');
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const stopBtn = document.getElementById('stopBtn');
const audioPlayer = document.getElementById('audioPlayer');
const voiceSelect = document.getElementById('voiceSelect');
const speedSlider = document.getElementById('speedSlider');
const sampleRateSelect = document.getElementById('sampleRateSelect');

function updateStatus(message, type = 'loading') {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Text cleaning and tokenization functions
class TextCleaner {
    constructor() {
        const _pad = "$";
        const _punctuation = ';:,.!?¡¿—…"«»"" ';
        const _letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const _letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ";
        
        const symbols = [_pad, ...Array.from(_punctuation), ...Array.from(_letters), ...Array.from(_letters_ipa)];
        
        this.wordIndexDictionary = {};
        symbols.forEach((symbol, i) => {
            this.wordIndexDictionary[symbol] = i;
        });
    }
    
    clean(text) {
        const indexes = [];
        for (const char of text) {
            if (this.wordIndexDictionary[char] !== undefined) {
                indexes.push(this.wordIndexDictionary[char]);
            }
        }
        return indexes;
    }
}

function basicEnglishTokenize(text) {
    // Improved tokenizer for phonemes - keep IPA characters together
    // Split on whitespace but keep phoneme symbols as units
    return text.split(/\s+/).filter(token => token.length > 0);
}

// Proper phonemizer using phonemizer package
async function phonemizeText(text) {
    try {
        // Use phonemizer with espeak backend
        const phonemeResult = await phonemize(text, 'en-us', {
            backend: 'espeak',
            preserve_punctuation: true,
            with_stress: false
        });
        
        // Clean up the phonemes - remove excessive stress marks that might cause accent issues
        const cleanedPhonemes = Array.isArray(phonemeResult) 
            ? phonemeResult.map(p => p)
            : phonemeResult;

        return cleanedPhonemes || text;
    } catch (error) {
        console.warn('Phonemization failed, using simplified version:', error);
        // Fallback to simple approximation
        return simplePhonemeApproximation(text);
    }
}

// Fallback simple phonemizer (kept as backup)
function simplePhonemeApproximation(text) {
    return text.toLowerCase()
        .replace(/ph/g, 'f')
        .replace(/ch/g, 'tʃ')
        .replace(/sh/g, 'ʃ')
        .replace(/th/g, 'θ')
        .replace(/ng/g, 'ŋ')
        .replace(/a/g, 'ə')
        .replace(/e/g, 'ɛ')
        .replace(/i/g, 'ɪ')
        .replace(/o/g, 'ɔ')
        .replace(/u/g, 'ʊ');
}

async function loadModel() {
    try {
        updateStatus('Loading Kitten TTS model and voices...', 'loading');
        
        // Load the ONNX model
        session = await ort.InferenceSession.create('./model/kitten_tts_nano_v0_1.onnx');
        
        // Load real voice embeddings from JSON
        const voicesResponse = await fetch('./model/voices.json');
        const voicesData = await voicesResponse.json();
        
        // Convert to Float32Arrays
        voices = {};
        for (const [voiceName, voiceArray] of Object.entries(voicesData)) {
            // Handle both 1D and 2D arrays (flatten if needed)
            const flatArray = Array.isArray(voiceArray[0]) ? voiceArray.flat() : voiceArray;
            voices[voiceName] = new Float32Array(flatArray);
        }
        
        updateStatus('Model loaded successfully! Ready to generate speech.', 'ready');
        textInput.disabled = false;
        generateBtn.disabled = false;
        voiceSelect.disabled = false;
        speedSlider.disabled = false;
        sampleRateSelect.disabled = false;
        
    } catch (error) {
        console.error('Error loading model:', error);
        updateStatus(`Error loading model: ${error.message}`, 'error');
    }
}

window.generateSpeech = async function() {
    if (!session || !voices) {
        updateStatus('Model not loaded yet!', 'error');
        return;
    }
    
    const text = textInput.value.trim();
    if (!text) {
        updateStatus('Please enter some text first!', 'error');
        return;
    }
    
    try {
        generateBtn.disabled = true;
        updateStatus('Generating speech...', 'loading');
        
        const textCleaner = new TextCleaner();
        const voice = voiceSelect.value;
        const speed = parseFloat(speedSlider.value);
        const sampleRate = parseInt(sampleRateSelect.value);
        
        // Phonemize (returns array)
        const phonemesList = await phonemizeText(text);

        // Join phoneme segments and tokenize
        const allPhonemes = Array.isArray(phonemesList) ? phonemesList.join(' ') : phonemesList;
        const phonemeTokens = basicEnglishTokenize(allPhonemes);

        // Join back to string
        const phonemeString = phonemeTokens.join(' ');

        // convert to token IDs
        let tokenIds = textCleaner.clean(phonemeString);

        // Add start and end tokens
        tokenIds.unshift(0);
        tokenIds.push(0);
        
        // ONNX inputs
        const inputIds = new ort.Tensor('int64', BigInt64Array.from(tokenIds.map(id => BigInt(id))), [1, tokenIds.length]);
        const style = new ort.Tensor('float32', voices[voice], [1, voices[voice].length]);
        const speedTensor = new ort.Tensor('float32', new Float32Array([speed]), [1]);

        const feeds = {
            'input_ids': inputIds,
            'style': style,
            'speed': speedTensor
        };
        
        const results = await session.run(feeds);
        
        // Process output
        const audioOutput = results[Object.keys(results)[0]];
        
        let audioData = audioOutput.data;
        
        // Handle different output formats
        if (audioOutput.dims.length > 1) {
            // If it's 2D, flatten it
            audioData = new Float32Array(audioOutput.data);
        }
        
        // Less aggressive trimming and ensure we don't cut too much
        const trimStart = Math.min(1000, Math.floor(audioData.length * 0.05));
        const trimEnd = Math.min(2000, Math.floor(audioData.length * 0.05));
        const trimmedAudio = audioData.slice(trimStart, audioData.length - trimEnd);
        
        // Convert to playable audio with normalization
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = audioContext.createBuffer(1, trimmedAudio.length, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        
        // Normalize the audio to prevent clipping and breakup
        let maxAbs = 0;
        for (let i = 0; i < trimmedAudio.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(trimmedAudio[i]));
        }
        
        const normalizedGain = maxAbs > 0 ? 0.8 / maxAbs : 1;
        for (let i = 0; i < trimmedAudio.length; i++) {
            channelData[i] = trimmedAudio[i] * normalizedGain;
        }
        
        // Create WAV file directly instead of using AudioContext playback
        const wav = audioBufferToWav(audioBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        
        // Set up audio player
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';
        
        // Force reload to ensure clean playback
        audioPlayer.load();
        
        // Play with a small delay to ensure it's loaded
        setTimeout(() => {
            audioPlayer.play().catch(e => console.log('Playback failed:', e));
        }, 100);
        
        stopBtn.disabled = false;
        updateStatus('Speech generated successfully!', 'ready');
        
    } catch (error) {
        console.error('Error generating speech:', error);
        updateStatus(`Error generating speech: ${error.message}`, 'error');
    } finally {
        generateBtn.disabled = false;
    }
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    const sampleRate = buffer.sampleRate;
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
    }
    
    return arrayBuffer;
}

window.stopAudio = function() {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    stopBtn.disabled = true;
};

// Load model on page load
loadModel();