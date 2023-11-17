import {OperationMetadata} from "../operation-metadata";


/**
 * Metadata for POST /audio/tracks
 *
 * see: http://services-demo.booktrack.com/audio/help/operations/UploadAudio
 */
export const uploadAudio: OperationMetadata<undefined, RequestBody, ResponseBody> = {
    requestParameters: false,
    requestBodyType: "form",
    responseBodyType: "json",
    method: "post",
    url(baseUrl: string): string {
        return `${baseUrl}/audio/tracks`;
    },
    formData(body: RequestBody): FormData {
        const formData = new FormData();
        formData.append("metadata", JSON.stringify({
            fileName: body.fileName,
            title: body.title,
            audioType: body.audioType,
            description: body.description
        }));
        formData.append("file", body.blob, "File");
        return formData;
    },
};

export interface RequestBody {
    blob: Blob;
    fileName: string;
    title: string;
    audioType: "Music" | "Ambience" | "SoundEffect";
    description: string;
}

export interface ResponseBody extends ServiceResponse {
    resultCodes: string[];
}

export interface ServiceResponse {
    debug: string[];
}
