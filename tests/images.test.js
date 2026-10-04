import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_IMAGE_TYPES,
  COMPRESS_ABOVE_BYTES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_LABEL,
  MAX_PROOF_IMAGE_BYTES,
  dataUrlBytes,
  formatBytes,
  validateImageFile,
} from "../src/utils/images.js";

// The rules a browser reports for a picked file; no real bytes needed.
function fakeFile({ name, type, size }) {
  return { name, type, size };
}

// A typical modern phone photo: well over the old 500 KB ceiling.
const phonePhoto = fakeFile({
  name: "IMG_20260918_114233.jpg",
  type: "image/jpeg",
  size: 3.4 * 1024 * 1024,
});

describe("Image upload rules", () => {
  it("1. accepts a normal phone photo larger than 500 KB", () => {
    assert.ok(phonePhoto.size > 500 * 1024);
    assert.equal(validateImageFile(phonePhoto), null);
  });

  it("2. compresses anything above the compression threshold", () => {
    assert.ok(phonePhoto.size > COMPRESS_ABOVE_BYTES);
    assert.equal(validateImageFile(phonePhoto), null);
  });

  it("3. accepts the documented formats", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      const file = fakeFile({ name: `photo.${type.slice(6)}`, type, size: 900 * 1024 });
      assert.equal(validateImageFile(file), null, `${type} should be allowed`);
    }
  });

  it("4. rejects unsupported formats", () => {
    const pdf = fakeFile({ name: "notes.pdf", type: "application/pdf", size: 120 * 1024 });
    assert.match(validateImageFile(pdf), /JPEG, PNG, and WebP/);

    const gifs = fakeFile({ name: "animation.gif", type: "image/gif", size: 120 * 1024 });
    assert.match(validateImageFile(gifs), /JPEG, PNG, and WebP/);
  });

  it("5. rejects anything over 5 MB with the size in the message", () => {
    const huge = fakeFile({
      name: "huge.png",
      type: "image/png",
      size: MAX_IMAGE_BYTES + 1024,
    });
    const message = validateImageFile(huge);
    assert.match(message, /too large/);
    assert.ok(message.includes(MAX_IMAGE_LABEL));
  });

  it("6. proofs use the smaller per-image ceiling", () => {
    const proof = fakeFile({
      name: "proof.jpg",
      type: "image/jpeg",
      size: MAX_PROOF_IMAGE_BYTES - 1024,
    });
    assert.equal(validateImageFile(proof, MAX_PROOF_IMAGE_BYTES), null);
    assert.match(validateImageFile(phonePhoto, MAX_PROOF_IMAGE_BYTES), /too large/);
  });

  it("7. ignores a missing file and handles empty mime types", () => {
    assert.equal(validateImageFile(null), null);
    assert.equal(validateImageFile(undefined), null);

    const cameraFile = fakeFile({
      name: "photo.jpg",
      type: "",
      size: 200 * 1024,
    });
    assert.equal(validateImageFile(cameraFile), null);
  });

  it("8. measures the decoded size of a data URL", () => {
    const dataUrl = `data:image/jpeg;base64,${"A".repeat(300)}`;
    assert.equal(dataUrlBytes(dataUrl), 225);
    assert.equal(dataUrlBytes(""), 0);
    assert.equal(dataUrlBytes(null), 0);
  });

  it("9. formats sizes for the UI", () => {
    assert.equal(formatBytes(820 * 1024), "820 KB");
    assert.equal(formatBytes(3.4 * 1024 * 1024), "3.4 MB");
    assert.equal(formatBytes(12 * 1024 * 1024), "12 MB");
  });
});