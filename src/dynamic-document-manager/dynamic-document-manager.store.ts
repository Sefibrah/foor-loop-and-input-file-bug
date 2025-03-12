import { computed, inject } from '@angular/core';
import { catchError, filter, finalize, map, pipe, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { rxResource } from '@angular/core/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import type { FileMetadata } from '@scs/api';
import { ApiErrorHandler, ApiKeyAuthService, FileService, PermissionService } from '@scs/api';
import { HttpEventType } from '@angular/common/http';
import { ToastsService } from '@scs/helpers';

type DynamicDocumentManagerState = {
  entityId: string;
  entityType: string;
  _isLoading: boolean;
  fileType?: string;
  name?: string;
  totalCount: number;
  sort: string;
  page: number;
  limit: number;
  selectedPdfToRead: FileMetadata | null;
  progressPercent: number | undefined;
};

const initialState: DynamicDocumentManagerState = {
  entityId: '',
  entityType: '',
  _isLoading: false,
  page: 1,
  totalCount: 0,
  sort: 'name',
  limit: 10,
  selectedPdfToRead: null,
  progressPercent: undefined,
};

export const DynamicDocumentManagerStore = signalStore(
  withState(initialState),
  withProps(() => ({
    _fileService: inject(FileService),
    _apiKeyAuthService: inject(ApiKeyAuthService),
    _errHandler: inject(ApiErrorHandler),
    _toastSrv: inject(ToastsService),
    _permissionSrv: inject(PermissionService),
    _cancelUpload$: new Subject<void>(),
  })),
  withComputed((store) => ({
    offset: computed(() => store.page() * store.limit() - store.limit()),
  })),
  withProps((store) => ({
    _token: rxResource({ loader: () => store._apiKeyAuthService.getToken() }),
    _documentsResource: rxResource({
      request: () => ({
        entityId: store.entityId(),
        entityType: store.entityType(),
        limit: store.limit(),
        offset: store.offset(),
        sort: store.sort(),
      }),
      loader: (params) => {
        const { entityId, entityType, ...queryParams } = params.request;
        return store._fileService.findEntityFiles(entityId, entityType, queryParams).pipe(
          tapResponse({
            next: (response) => {
              patchState(store, {
                totalCount: parseInt(response.headers.get('X-Total-Count') ?? '0', 10),
              });
            },
            error: console.error,
          }),
          map((response) => response.body ?? ([] as FileMetadata[])),
        );
      },
    }),
  })),
  withProps((store) => ({
    documentsResource: store._documentsResource.asReadonly(),
    tokenResource: store._token.asReadonly(),
    readonly: !store._permissionSrv.hasRole('BASIC_WRITE'),
    maxFileSize: 10485760,
  })),
  withComputed((store) => ({
    isLoading: computed(() => store._documentsResource.isLoading() || store._isLoading()),
    uploadInProgress: computed(() => typeof store.progressPercent() === 'number'),
  })),
  withMethods((store) => ({
    updateEntityId: signalMethod<string>((entityId) => {
      patchState(store, { entityId });
    }),
    updateEntityType: signalMethod<string>((entityType) => {
      patchState(store, { entityType });
    }),
    loadDocuments: () => {
      store.documentsResource.reload();
    },
    uploadFile: rxMethod<File>(
      pipe(
        filter((file) => {
          const isSizeLimitReached = file.size > store.maxFileSize;
          if (isSizeLimitReached) {
            store._toastSrv.error($localize`:@@vos.dynamic-document-manager.upload-file.size-limit-reached:Your file is too big`);
          }
          return !isSizeLimitReached;
        }),
        tap(() => patchState(store, { _isLoading: true })),
        switchMap((file) =>
          store._fileService.uploadFile(store.entityId(), store.entityType(), file).pipe(
            finalize(() => {
              patchState(store, { _isLoading: false, progressPercent: undefined });
              store._documentsResource.reload();
            }),
            tap((event) => {
              if (!event) {
                return;
              }
              if (event.type === HttpEventType.UploadProgress) {
                if (event.total && event.loaded) {
                  try {
                    const percent = (event.loaded / event.total) * 100;
                    if (percent < 100) {
                      patchState(store, { progressPercent: Math.min(percent, 100) });
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }
              } else if (event.type === HttpEventType.ResponseHeader && !event.ok) {
                patchState(store, { progressPercent: undefined });
              } else {
                if (event.type === HttpEventType.Response) {
                  store._toastSrv.success($localize`:@@vos.dynamic-document-manager.upload-file.success:File uploaded successfully!`);
                }
              }
            }),
            catchError(store._errHandler.getErrCatcherWithContinue()),
            takeUntil(store._cancelUpload$),
          ),
        ),
      ),
    ),
    cancelUpload: rxMethod<void>(pipe(tap(() => store._cancelUpload$.next()))),
    deleteFile: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { _isLoading: true })),
        switchMap((fileUuid) => {
          return store._fileService.deleteFile(store.entityId(), store.entityType(), fileUuid).pipe(
            finalize(() => patchState(store, { _isLoading: false })),
            catchError(store._errHandler.getErrCatcher()),
            tap(() => {
              store._documentsResource.reload();
              store._toastSrv.success($localize`:@@vos.dynamic-document-manager.delete-file.success:File deleted successfully!`);
            }),
          );
        }),
      ),
    ),
    updateFile: rxMethod<{ fileUuid: string; newFile: File }>(
      pipe(
        tap(() => patchState(store, { _isLoading: true })),
        switchMap(({ fileUuid, newFile }) => {
          return store._fileService.updateFile(store.entityId(), store.entityType(), fileUuid, newFile).pipe(
            tapResponse({
              next: () => store._documentsResource.reload(),
              error: console.error,
              finalize: () => patchState(store, { _isLoading: false }),
            }),
          );
        }),
      ),
    ),
    updateMetadata: rxMethod<{ fileUuid: string; metadata: Pick<FileMetadata, 'name' | 'description' | 'fileType'> }>(
      pipe(
        tap(() => patchState(store, { _isLoading: true })),
        switchMap(({ fileUuid, metadata }) => {
          return store._fileService.updateFileMetadata(store.entityId(), store.entityType(), fileUuid, metadata).pipe(
            tapResponse({
              next: () => store._documentsResource.reload(),
              error: console.error,
              finalize: () => patchState(store, { _isLoading: false }),
            }),
          );
        }),
      ),
    ),
    patchState: signalMethod<Partial<Pick<DynamicDocumentManagerState, 'sort' | 'fileType' | 'name' | 'page' | 'limit' | 'selectedPdfToRead'>>>((props) => {
      patchState(store, props);
    }),
  })),
);
