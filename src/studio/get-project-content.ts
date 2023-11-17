import {OperationMetadata} from "../operation-metadata";


/**
 * Metadata for GET /studio/project/{PROJECTID}/content
 *
 * see: http://services-demo.booktrack.com/studio/help/operations/GetProjectContent
 */
export const getProjectContent: OperationMetadata<RequestParameters, undefined, ResponseBody> = {
    requestParameters: true,
    requestBodyType: "none",
    responseBodyType: "json",
    method: "get",
    url(baseUrl: string, requestParameters: RequestParameters): string {
        return `${baseUrl}/studio/project/${requestParameters.projectid}/content`;
    },
};

export interface RequestParameters {
    projectid: string | number | boolean;
}

export type JSONML
    = [JSONMLTagName, JSONMLAttributes, JSONMLElementList]
    | [JSONMLTagName, JSONMLAttributes]
    | [JSONMLTagName, JSONMLElementList]
    | [JSONMLTagName]
    | string;
export type JSONMLTagName = string;
export type JSONMLAttributes = { [name: string]: string | number | boolean; };
export interface JSONMLElementList extends Array<JSONML> { }

export type RelativeCFIRange = string;             // A CFI range that is relative to an element
export type AudioLayoutEditorCFIPath = string;     // A CFI path that is absolute within the audio layout editor text

export interface ResponseBody {
    // See: http://www.idpf.org/epub/301/spec/epub-contentdocs.html#sec-xhtml-nav-def-model for more about TOC.
    // Targets are always in ascending spine/document order.
    tableOfContents?: RootNavigationItem;
    parts: Block[];
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

export interface Block {
    content: JSONML;
    tokens: RelativeCFIRange[];
}

export interface Project2AudioRegion {
    clientResourceId: string;
    fadeIn: number;
    fadeOut: number;
    first: number;
    last: number;
    linearPanningEnvelope: AudioEnvelopePoint[];
    linearVolumeEnvelope: AudioEnvelopePoint[];
    loop: boolean;
    metadata: AudioRegionMetadata;
    track: AudioRegionTrackInfo;
    trackId: string;
    volume: number;
}

export interface AudioRegionMetadata {
    realignment: AudioRegionRealignmentInfo;
}

export interface AudioRegionRealignmentInfo {
    codes: string[];
}

export interface AudioRegionTrackInfo {
    audioType: string;
    title: string;
    trackUris: AudioRegionTrackUriInfo;
}

export interface AudioRegionTrackUriInfo {
    mp4: string;
    ogg: string;
}

export interface AudioEnvelopePoint {
    x: number;
    y: number;
}
