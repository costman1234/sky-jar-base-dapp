import type { Address } from "viem";

export const MAX_SKY_LENGTH = 32;
export const MAX_FEEL_LENGTH = 24;
export const MAX_MOOD_LENGTH = 24;
export const MAX_NOTE_LENGTH = 180;

export const skyJarAbi = [
  {
    type: "event",
    name: "SkySaved",
    inputs: [
      { name: "noteId", type: "uint256", indexed: true },
      { name: "observer", type: "address", indexed: true },
      { name: "sky", type: "string", indexed: false },
      { name: "feel", type: "string", indexed: false },
      { name: "mood", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveSky",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sky", type: "string" },
      { name: "feel", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "noteId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getSky",
    stateMutability: "view",
    inputs: [{ name: "noteId", type: "uint256" }],
    outputs: [
      { name: "observer", type: "address" },
      { name: "sky", type: "string" },
      { name: "feel", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextNoteId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredSkyJarContractAddress =
  process.env.NEXT_PUBLIC_SKY_JAR_CONTRACT_ADDRESS?.trim();

export const skyJarContractAddress = isAddressLike(
  configuredSkyJarContractAddress,
)
  ? (configuredSkyJarContractAddress as Address)
  : undefined;
