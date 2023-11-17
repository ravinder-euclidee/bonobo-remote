/* tslint:disable arrow-return-shorthand unified-signatures */

import { Observable } from "rxjs";

import { OperationMetadata } from "./operation-metadata";


export abstract class Remote {
    /**
     * The initial stage of the fluent request api.
     */
    abstract operation<Q, B, R>(metadata: OperationMetadata<undefined, undefined, R>): Requestable<R>;
    abstract operation<Q, B, R>(metadata: OperationMetadata<Q, undefined, R>): NeedsQueryThenRequestable<Q, R>;
    abstract operation<Q, B, R>(metadata: OperationMetadata<undefined, B, R>): NeedsBodyThenRequestable<B, R>;
    abstract operation<Q, B, R>(metadata: OperationMetadata<Q, B, R>): NeedsQueryThenNeedsBodyThenRequestable<Q, B, R>;
}

/**
 * The final stage of the fluent request api.
 */
export interface Requestable<R> {
    requestJson(): Observable<R>;
}

/**
 * An intermediate stage of the fluent request api.
 */
export interface NeedsQueryThenRequestable<Q, R>  {
    withQuery(query: Q): Requestable<R>;
}

/**
 * An intermediate stage of the fluent request api.
 */
export interface NeedsBodyThenRequestable<B, R>  {
    withBody(body: B): Requestable<R>;
}

/**
 * An intermediate stage of the fluent request api.
 */
export interface NeedsQueryThenNeedsBodyThenRequestable<Q, B, R>  {
    withQuery(query: Q): NeedsBodyThenRequestable<B, R>;
}
