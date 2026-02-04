import { getItemReference } from "../../../terraform/serializeTerraform/getItemReference";
import { TerraformDataIamPolicyDocument, TerraformResourceIamPolicy } from "./types";

export function createRolePolicy(roleDocument: TerraformDataIamPolicyDocument): TerraformResourceIamPolicy {
  const rolePolicy: TerraformResourceIamPolicy = {
    key: 'resource',
    name: `${roleDocument.name}-policy`,
    type: 'aws_iam_policy',
    properties: {
      name: `${roleDocument.name}-policy`,
      policy: getItemReference(roleDocument, 'json'),
    }
  }

  return rolePolicy;
}