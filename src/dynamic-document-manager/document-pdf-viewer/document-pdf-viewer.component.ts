import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, input, model, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FileMetadata } from '@scs/api';

@Component({
  selector: 'scs-document-pdf-viewer',
  imports: [PdfViewerModule, NgClass],
  templateUrl: './document-pdf-viewer.component.html',
  styleUrl: './document-pdf-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPdfViewerComponent {
  public readonly token = input.required<string | undefined>();
  public readonly selectedPdfToRead = model.required<FileMetadata | null>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly fullFileUrl = computed(() => {
    if (this.selectedPdfToRead() == null) {
      return '';
    } else {
      return new URL(
        this.selectedPdfToRead()!.fileUrl.replace('https://api.scs-luettgen.com', '') +
          '?apiKey=' +
          this.token() +
          '&filename=' +
          this.selectedPdfToRead()!.preferredFileName,
        location.origin,
      ).toString();
    }
  });

  constructor() {
    afterRenderEffect({
      earlyRead: () => ({ dialog: this.dialog() }),
      write: (params) => {
        const { dialog } = params();
        if (dialog != null) {
          if (this.selectedPdfToRead()) {
            dialog.nativeElement.showModal();
          } else {
            dialog.nativeElement.close();
            this.selectedPdfToRead.set(null);
          }
        }
      },
    });
  }

  protected closePdfViewer(): void {
    this.selectedPdfToRead.set(null);
  }
}
