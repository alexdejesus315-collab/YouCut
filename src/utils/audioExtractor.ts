/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to extract audio from video/audio files directly inside the browser
 * and convert it to a highly compressed Mono 16kHz WAV format for Gemini API ingestion.
 */

export async function extractAudioAsWav(file: File): Promise<{ base64: string; mimeType: string }> {
  // Use Browser's AudioContext to decode audio
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Decode Audio using native browser hardware decoder
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Use first channel (Mono)
    const rawData = audioBuffer.getChannelData(0);
    
    // Convert Float32 samples into stable 16-bit PCM WAV file
    const wavBuffer = new ArrayBuffer(44 + rawData.length * 2);
    const view = new DataView(wavBuffer);
    
    // RIFF identifier
    writeString(view, 0, "RIFF");
    // file length
    view.setUint32(4, 36 + rawData.length * 2, true);
    // RIFF type
    writeString(view, 8, "WAVE");
    // format chunk identifier
    writeString(view, 12, "fmt ");
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = raw linear PCM)
    view.setUint16(20, 1, true);
    // channel count (1 = Mono)
    view.setUint16(22, 1, true);
    // sample rate (16000 Hz)
    view.setUint32(24, 16000, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, 16000 * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample (16 bits)
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, "data");
    // chunk length
    view.setUint32(40, rawData.length * 2, true);
    
    // Write PCM samples
    floatTo16BitPCM(view, 44, rawData);
    
    const blob = new Blob([view], { type: "audio/wav" });
    const base64 = await blobToBase64(blob);
    
    return {
      base64,
      mimeType: "audio/wav"
    };
  } finally {
    // Make sure to close the context to prevent audio engine leaks
    if (audioContext.state !== "closed") {
      audioContext.close();
    }
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
