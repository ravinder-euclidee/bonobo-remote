import {OperationMetadata} from "../operation-metadata";


/**
 * Metadata for POST /studio/project/{PROJECTID}/cover
 *
 * see: http://services-demo.booktrack.com/studio/help/operations/UploadCover
 */


export const uploadCover: OperationMetadata<RequestParameters, RequestBody, ResponseBody> = {
    requestParameters: true,
    requestBodyType: "form",
    responseBodyType: "json",
    method: "post",
    url(baseUrl: string, requestParameters: RequestParameters): string {
        return `${baseUrl}/studio/project/${requestParameters.projectId}/cover`;
    },
    formData(body: RequestBody): FormData {
        const formData = new FormData();
        formData.append("image", body.imageBlob, body.fileName);
        return formData;
    },
};

export interface RequestParameters {
    projectId: string;
}

export interface RequestBody {
    imageBlob: Blob;
    fileName: string
}

export interface ResponseBody {
    debug: string[];
}

export interface ServiceResponse {
    debug: string[];
}
