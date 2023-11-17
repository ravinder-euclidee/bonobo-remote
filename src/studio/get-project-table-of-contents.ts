import {OperationMetadata} from "../operation-metadata";


/**
 * Metadata for GET /studio/project/{PROJECTID}/table-of-contents
 *
 * see: http://services-demo.booktrack.com/studio/help/operations/GetProjectTableOfContents
 */
export const getProjectTableOfContents: OperationMetadata<RequestParameters, undefined, ResponseBody> = {
    requestParameters: true,
    requestBodyType: "none",
    responseBodyType: "json",
    method: "get",
    url(baseUrl: string, requestParameters: RequestParameters): string {
        return `${baseUrl}/studio/project/${requestParameters.projectid}/table-of-contents`;
    },
};

export interface RequestParameters {
    projectid: string | number | boolean;
}

export type AudioLayoutEditorCFIPath = string;     // A CFI path that is absolute within the audio layout editor text

export interface ResponseBody {
    // See: http://www.idpf.org/epub/301/spec/epub-contentdocs.html#sec-xhtml-nav-def-model for more about TOC.
    // Targets are always in ascending spine/document order.
    tableOfContents: RootNavigationItem;
}

export interface RootNavigationItem {
    label: string;                                     // required (empty string allowed)
    items: (ContainerNavigationItem|NavigationItem)[]; // non-empty
}

export interface ContainerNavigationItem {
    label: string;                                     // required (non-empty string)
    target?: AudioLayoutEditorCFIPath;                  // optional (falsy if not present)
    items: (ContainerNavigationItem|NavigationItem)[]; // non-empty
}

export interface NavigationItem {
    label: string;                                     // required (non-empty string)
    target: AudioLayoutEditorCFIPath;                  // required
}