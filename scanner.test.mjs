import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {sampleQR} from '../packages/core/fixtures.mjs';
import {decodeQR} from '../packages/core/qr.mjs';
for(const type of ['USD','KHR','VND','STATIC']) test(`Generated QR image decodes using the same scanner library: ${type}`,async()=>{const raw=sampleQR(type);const buffer=await QRCode.toBuffer(raw,{width:600,margin:3});const img=PNG.sync.read(buffer);const result=jsQR(new Uint8ClampedArray(img.data),img.width,img.height);assert.equal(result.data,raw);assert.equal(decodeQR(result.data).isValid,true);});
