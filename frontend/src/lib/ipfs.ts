export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  created_at?: string;
  creator?: string;
}

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

if (!PINATA_JWT) {
  console.warn('PINATA_JWT not found in environment variables');
}

export async function uploadToIPFS(file: File): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured. Please add NEXT_PUBLIC_PINATA_JWT to your environment variables.');
    }

    console.log('Uploading file to IPFS:', file.name, file.size, 'bytes');

    const formData = new FormData();
    formData.append('file', file);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });

    const pinataMetadata = JSON.stringify({
      name: `${file.name}-${Date.now()}`,
      keyvalues: {
        uploaded_by: 'chainverse_nft_marketplace',
        file_type: file.type,
        upload_timestamp: new Date().toISOString(),
      },
    });

    formData.append('pinataOptions', pinataOptions);
    formData.append('pinataMetadata', pinataMetadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    const ipfsUrl = `${PINATA_GATEWAY}/${result.IpfsHash}`;
    
    console.log('File uploaded to IPFS successfully:', ipfsUrl);
    return ipfsUrl;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  try {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT not configured. Please add NEXT_PUBLIC_PINATA_JWT to your environment variables.');
    }

    console.log('Uploading metadata to IPFS:', metadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataOptions: {
          cidVersion: 1,
        },
        pinataMetadata: {
          name: `${metadata.name}-metadata-${Date.now()}`,
          keyvalues: {
            uploaded_by: 'chainverse_nft_marketplace',
            content_type: 'nft_metadata',
            nft_name: metadata.name,
            upload_timestamp: new Date().toISOString(),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(`Metadata upload failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    const metadataUrl = `${PINATA_GATEWAY}/${result.IpfsHash}`;
    
    console.log('Metadata uploaded to IPFS successfully:', metadataUrl);
    return metadataUrl;
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw new Error(`Failed to upload metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchMetadata(tokenURI: string): Promise<NFTMetadata> {
  try {
    console.log('Fetching metadata from:', tokenURI);
    
    // Handle different URI formats
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', `${PINATA_GATEWAY}/`);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();
    
    console.log('Fetched metadata:', metadata);
    
    // Process image URL if needed
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = metadata.image.replace('ipfs://', `${PINATA_GATEWAY}/`);
    }

    // Validate metadata structure
    if (!metadata.name || !metadata.image) {
      throw new Error('Invalid metadata structure: missing required fields');
    }

    return metadata as NFTMetadata;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    
    // Return fallback metadata instead of throwing
    return {
      name: 'Unknown NFT',
      description: 'Metadata could not be loaded',
      image: '/placeholder-nft.png',
      attributes: [],
    };
  }
}

// Utility function to validate IPFS hash
export function isValidIPFSHash(hash: string): boolean {
  // Basic validation for IPFS hash (CID v0 and v1)
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidV1Regex = /^b[a-z2-7]{58}$/;
  const cidV1Base32Regex = /^b[A-Za-z2-7]{58}$/;
  
  return cidV0Regex.test(hash) || cidV1Regex.test(hash) || cidV1Base32Regex.test(hash);
}

// Utility function to extract IPFS hash from URL
export function extractIPFSHash(url: string): string | null {
  try {
    const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Utility to convert IPFS URL to HTTP gateway URL
export function ipfsToHttp(ipfsUrl: string): string {
  if (ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl.replace('ipfs://', `${PINATA_GATEWAY}/`);
  }
  return ipfsUrl;
}