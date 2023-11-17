//
// WARNING! This file is auto-generated.
//

import {OperationMetadata} from "{{{relativeRoot}}}/operation-metadata";


/**
 * Metadata for {{{method}}} {{{uri}}}
 *
 * see: {{{helpUrl}}}
 */
export const {{{operationName}}}: OperationMetadata{{{metadataTypeVariables}}} = {
    requestParameters: {{{requestParameters}}},
    requestBodyType: "{{{requestBodyType}}}",
    responseBodyType: "{{{responseBodyType}}}",
    method: "{{{lowercaseMethod}}}",
    url(baseUrl: string{{{maybeRequestParametersParameter}}}): string {
        return {{{uriBuilder}}};
    },
};

{{{interfaces}}}
