import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '358e4b90254d434cdc86';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '1bc2d870951ee03248885736f9b82af97eefac89fc1c3e5ff9e4176b9b24c676';

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  created_at?: string;
  creator?: string;
}

export const fetchMetadata = async (tokenURI: string): Promise<NFTMetadata> => {
  try {
    // Handle IPFS protocol
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = `https://gateway.pinata.cloud/ipfs/${tokenURI.substring(7)}`;
    } else if (tokenURI.startsWith('undefined')) {
      // Handle cases where URI might be malformed "undefined" string
      throw new Error('Invalid token URI');
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    throw new Error('Failed to fetch metadata');
  }
};

export const uploadFileToIPFS = async (file: File): Promise<string> => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(url, formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      }
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

export const uploadJSONToIPFS = async (jsonData: NFTMetadata): Promise<string> => {
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  try {
    const response = await axios.post(url, jsonData, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      }
    });

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
};