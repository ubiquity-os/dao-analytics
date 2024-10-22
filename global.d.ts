import { Ethereum } from "ethereum-protocol";

export {}; // do not remove this line

declare global {
  interface Window {
    ethereum: Ethereum;
  }
}
