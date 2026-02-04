import { Block } from "./Block";

export interface BlockListing extends Partial<Block> {
  publicId?: string;
  svgContent?: string;
  title: string;
  type: string;
  isPrimitive: boolean;
}