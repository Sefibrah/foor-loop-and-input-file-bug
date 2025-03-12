import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NgbPagination, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { DocumentListItemComponent } from './document-list-item/document-list-item.component';
import { DocumentManagerDropzoneComponent } from './document-manager-dropzone/document-manager-dropzone.component';
import { DynamicDocumentManagerStore } from './dynamic-document-manager.store';
import { DocumentUploadFilesBtnComponent } from './document-upload-files-btn/document-upload-files-btn.component';
import { FileMetadata } from '@scs/api';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentPdfViewerComponent } from './document-pdf-viewer/document-pdf-viewer.component';

@Component({
  selector: 'scs-dynamic-document-manager',
  imports: [
    NgbPagination,
    DocumentListItemComponent,
    DocumentManagerDropzoneComponent,
    DocumentUploadFilesBtnComponent,
    NgClass,
    FormsModule,
    DocumentPdfViewerComponent,
    NgbProgressbarModule,
  ],
  templateUrl: './dynamic-document-manager.component.html',
  styleUrl: './dynamic-document-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DynamicDocumentManagerStore],
})
export class DynamicDocumentManagerComponent {
  #store = inject(DynamicDocumentManagerStore);

  public readonly entityId = input.required<string>();
  public readonly entityType = input.required<string>();

  protected readonly documents = this.#store.documentsResource;
  protected readonly isLoading = this.#store.isLoading;
  protected readonly collectionSize = this.#store.totalCount;
  protected readonly pageSize = this.#store.limit;
  protected readonly page = this.#store.page;
  protected readonly selectedPdfToRead = this.#store.selectedPdfToRead;
  protected readonly token = this.#store.tokenResource.value;
  protected readonly progressPercent = this.#store.progressPercent;
  protected readonly uploadInProgress = this.#store.uploadInProgress;
  protected readonly readonly = this.#store.readonly;

  constructor() {
    this.#store.updateEntityId(this.entityId);
    this.#store.updateEntityType(this.entityType);
  }

  protected loadDocuments(): void {
    this.#store.loadDocuments();
  }

  protected uploadFile(file: File): void {
    this.#store.uploadFile(file);
  }

  protected cancelUpload(): void {
    this.#store.cancelUpload();
  }

  protected updateFile(fileUuid: string, newFile: File): void {
    this.#store.updateFile({ fileUuid, newFile });
  }

  protected deleteFile(fileUuid: string): void {
    this.#store.deleteFile(fileUuid);
  }

  protected updateMetadata(fileUuid: string, metadata: Pick<FileMetadata, 'name' | 'description' | 'fileType'>): void {
    this.#store.updateMetadata({ fileUuid, metadata });
  }

  protected setPage(page: number): void {
    this.#store.patchState({ page });
  }

  protected setPageSize(pageSize: number): void {
    this.#store.patchState({ limit: pageSize });
  }

  protected setSelectedPdfToRead(selectedPdfToRead: FileMetadata | null): void {
    this.#store.patchState({ selectedPdfToRead });
  }
}
