import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { NgbPagination, NgbProgressbarModule } from "@ng-bootstrap/ng-bootstrap";
import { DocumentListItemComponent } from "./document-list-item/document-list-item.component";
import { DynamicDocumentManagerStore } from "./dynamic-document-manager.store";
import { NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "scs-dynamic-document-manager",
  imports: [NgbPagination, DocumentListItemComponent, NgClass, FormsModule, NgbProgressbarModule],
  templateUrl: "./dynamic-document-manager.component.html",
  styleUrl: "./dynamic-document-manager.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DynamicDocumentManagerStore],
})
export class DynamicDocumentManagerComponent {
  #store = inject(DynamicDocumentManagerStore);

  public readonly entityId = input.required<string>();
  public readonly entityType = input.required<string>();

  protected readonly documents = this.#store.documentsResource;
  protected readonly isLoading = this.#store.isLoading;
  protected readonly pageSize = this.#store.limit;
  protected readonly page = this.#store.page;
  protected readonly selectedPdfToRead = this.#store.selectedPdfToRead;
  protected readonly progressPercent = this.#store.progressPercent;
  protected readonly uploadInProgress = this.#store.uploadInProgress;

  constructor() {
    this.#store.updateEntityId(this.entityId);
    this.#store.updateEntityType(this.entityType);
  }

  protected loadDocuments(): void {
    this.#store.loadDocuments();
  }

  protected updateFile(fileUuid: string, newFile: File): void {
    console.log("~~~~~~~~~~  updateFile  ~~~~~~~~~~");
    console.log("fileUuid", fileUuid, "newFile", newFile);
    console.log("WELCOME TO THE PROBLEM... compare the fileUuid that you expected with the one that you've got...");
    this.#store.updateFile({ fileUuid, newFile });
  }

  protected deleteFile(fileUuid: string): void {
    console.log("~~~~~~~~~~  deleteFile  ~~~~~~~~~~");
    console.log("fileUuid", fileUuid);
    console.log("However, here the problem doesn't occur, because you get your expected fileUuid...");
    this.#store.deleteFile(fileUuid);
  }

  protected updateMetadata(
    fileUuid: string,
    metadata: any /*Pick<FileMetadata, "name" | "description" | "fileType">*/
  ): void {
    console.log("~~~~~~~~~~  updateMetadata  ~~~~~~~~~~");
    console.log("fileUuid", fileUuid, "metadata", metadata);
    console.log("However, here the problem doesn't occur, because you get your expected fileUuid...");
    this.#store.updateMetadata({ fileUuid, metadata });
  }
}
