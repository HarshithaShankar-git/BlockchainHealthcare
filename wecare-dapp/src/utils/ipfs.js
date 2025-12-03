// For local IPFS node
import { create } from "ipfs-http-client";

// If you run local daemon with default ports and enabled CORS:
// ipfs daemon
export const ipfsClient = create({ url: "http://127.0.0.1:5001/api/v0" });

/**
 * Upload a File object or Blob and return the CID string
 */
export async function uploadFileToIPFS(file) {
  const added = await ipfsClient.add(file);
  // added may have `.path` or `.cid`
  return (added.path) ? added.path : added.cid.toString();
}
