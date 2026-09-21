import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createPngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

function generatePng(size) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // bit depth: 8 bits per channel
  ihdrData[9] = 6; // color type: 6 = RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // Raw pixel data: each scanline has 1 filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + size * 4;
  const rawData = Buffer.alloc(size * scanlineLength);

  const center = size / 2;
  const cornerRadius = size * 0.22;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle background (#090d16)
      const dx = Math.max(Math.abs(x - center) - (center - cornerRadius), 0);
      const dy = Math.max(Math.abs(y - center) - (center - cornerRadius), 0);
      const distFromCorner = Math.sqrt(dx * dx + dy * dy);

      if (distFromCorner > cornerRadius) {
        // Transparent outside rounded rect
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Inside card background
      let r = 9, g = 13, b = 22, a = 255;

      // Draw Emerald/Cyan Civic Ring/Arch
      const distFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const ringOuter = size * 0.38;
      const ringInner = size * 0.22;

      if (distFromCenter >= ringInner && distFromCenter <= ringOuter) {
        // Gradient from Emerald (#10b981) to Cyan (#06b6d4)
        const t = (x + y) / (size * 2);
        r = Math.round(16 + (6 - 16) * t);
        g = Math.round(185 + (182 - 185) * t);
        b = Math.round(129 + (212 - 129) * t);
      }

      // Center diamond pin
      const diamondDist = Math.abs(x - center) + Math.abs(y - center);
      if (diamondDist <= size * 0.12) {
        r = 255; g = 255; b = 255; // White center spark
      } else if (diamondDist <= size * 0.16) {
        r = 6; g = 182; b = 212; // Cyan accent border
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // IDAT Chunk
  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createPngChunk('IDAT', compressedData);

  // IEND Chunk
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateIco(png16, png32) {
  // ICO Header: 2 bytes reserved (0), 2 bytes type (1 = ICO), 2 bytes count (2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(2, 4);

  const dirOffset = 6;
  const entrySize = 16;
  const imageOffset1 = dirOffset + entrySize * 2;
  const imageOffset2 = imageOffset1 + png16.length;

  // Entry 1: 16x16
  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(16, 0); // width
  entry1.writeUInt8(16, 1); // height
  entry1.writeUInt8(0, 2);  // color palette (0 = no palette)
  entry1.writeUInt8(0, 3);  // reserved
  entry1.writeUInt16LE(1, 4);  // color planes
  entry1.writeUInt16LE(32, 6); // bits per pixel
  entry1.writeUInt32LE(png16.length, 8); // size of image data
  entry1.writeUInt32LE(imageOffset1, 12); // offset

  // Entry 2: 32x32
  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(32, 0);
  entry2.writeUInt8(32, 1);
  entry2.writeUInt8(0, 2);
  entry2.writeUInt8(0, 3);
  entry2.writeUInt16LE(1, 4);
  entry2.writeUInt16LE(32, 6);
  entry2.writeUInt32LE(png32.length, 8);
  entry2.writeUInt32LE(imageOffset2, 12);

  return Buffer.concat([header, entry1, entry2, png16, png32]);
}

console.log("Generating multi-resolution PNG and ICO icons...");

const png16 = generatePng(16);
const png32 = generatePng(32);
const png180 = generatePng(180); // Apple touch icon standard
const png192 = generatePng(192); // PWA manifest icon
const png512 = generatePng(512); // PWA high-res splash icon
const ico = generateIco(png16, png32);

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);

console.log("✓ Successfully created favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, favicon-32x32.png, favicon-16x16.png");
