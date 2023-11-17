/* tslint:disable variable-name */

export interface OperationMetadata<Q, B, R> {
    __queryType__?: Q;
    __bodyType__?: B;
    __responseType__?: R;
    requestParameters: boolean;
    requestBodyType: "none" | "json" | "arraybuffer" | "form";
    responseBodyType: "none" | "json" | "arraybuffer";
    method: "get" | "post" | "put" | "delete" | "patch";
    url(baseUrl: string, query: Q): string;
    formData?(body: B): FormData;
}
