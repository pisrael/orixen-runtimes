import { BlockListing } from "./BlockListing";

export interface PendingBlock extends BlockListing {
  x: number;
  y: number;
  width: number;
  height: number;
}