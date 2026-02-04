import { FunctionBlockPublishVisibility } from "./FunctionBlock";

export interface PublishOptions {
  visibility: FunctionBlockPublishVisibility;
  version: string;
  description: string;
  comments: string;
  publicId: string;
}