import { DatePipe, NgClass } from '@angular/common';
import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnDestroy, output, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FileMetadata } from '@scs/api';
import { race, take, exhaustMap, EMPTY, Subject, takeUntil } from 'rxjs';
import { ConfirmRemoveComponent } from '../../confirm-remove/confirm-remove.component';

@Component({
  selector: 'scs-document-list-item',
  imports: [ReactiveFormsModule, DatePipe, NgClass],
  templateUrl: './document-list-item.component.html',
  styleUrl: './document-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class DocumentListItemComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  private readonly dynamicResizeText = viewChild<ElementRef<HTMLSpanElement>>('dynamicResizeText');
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly dropdown = viewChild<ElementRef<HTMLDivElement>>('dropdown');
  private readonly nameValueChanges = toSignal(this.form.get('name')!.valueChanges);

  public readonly document = input.required<FileMetadata>();
  public readonly token = input.required<string | undefined>();
  public readonly readonly = input<boolean>(false);

  protected readonly fileTypeBootstrapIconIdentifier = computed(() => {
    switch (this.document().fileType) {
      case 'doc':
      case 'docx':
        return 'file-earmark-font';
      case 'xls':
      case 'xlsx':
        return 'file-earmark-spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'file-earmark-slides';
      case 'pdf':
        return 'file-earmark-richtext';
      case 'zip':
      case 'rar':
        return 'file-earmark-zip';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'bmp':
      case 'tiff':
      case 'gif':
        return 'file-earmark-image';
      default:
        return 'file-earmark';
    }
  });
  protected readonly fullFileUrl = computed(
    () =>
      new URL(
        this.document().fileUrl.replace('https://api.scs-luettgen.com', '') + '?apiKey=' + this.token() + '&filename=' + this.document().preferredFileName,
        location.origin,
      ),
  );

  public readonly delete = output<void>();
  public readonly updateMetadata = output<Pick<FileMetadata, 'name' | 'description' | 'fileType'>>();
  public readonly updateFile = output<File>();
  /**
   * regular (click) event doesn't suffice, because it will interpret all clicks on inputs,
   * and the dropdown as "valid" clicks, but i really need the distinction that just the
   * document was clicked, and that's it...
   */
  public readonly openPdf = output<FileMetadata>();
  public readonly documentClicked = output<FileMetadata>();

  private readonly drop = new Subject<void>();

  constructor() {
    afterRenderEffect({
      earlyRead: () => this.document(),
      write: (document) => this.form.patchValue({ name: document().name, description: document().description }),
    });

    afterRenderEffect({
      earlyRead: () => this.nameValueChanges(),
      write: (nameValue) => (this.dynamicResizeText()!.nativeElement.textContent = nameValue() as string),
    });
  }

  ngOnDestroy(): void {
    this.drop.next();
    this.drop.complete();
  }

  protected fileSelectHandler(e: any) {
    e.preventDefault();
    const file = e.target.files[0] || e.dataTransfer.file[0];
    this.updateFile.emit(file);
  }

  protected updateFileMetadata() {
    if (this.form.valid && (this.document().name !== this.form.value.name || this.document().description !== this.form.value.description)) {
      this.updateMetadata.emit({
        name: this.form.value.name as string,
        description: this.form.value.description as string,
        fileType: this.document().fileType,
      });
    }
  }

  protected focus() {
    this.nameInput()!.nativeElement.focus();
  }

  protected onDocumentClicked($event: MouseEvent) {
    // very brittle, because it assumes that these are the only elements that can interfere with the document click
    // but then again, what is the best way to define this rule? some kind of class keyword or attribute to be attached
    // to the elements we don't want to interfere? could be a solution, but then again, it's not very flexible in my opinion...
    // but i'll put a fixme: in here, in case i find a better approach...
    // fixme: figure out a better way to define the rule for the document click
    if ($event.target instanceof HTMLInputElement || $event.target instanceof HTMLButtonElement || $event.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (this.document().fileType === 'pdf' && !this.dropdown()?.nativeElement.contains($event.target as HTMLElement)) {
      this.openPdf.emit(this.document());
    }
    this.documentClicked.emit(this.document());
  }

  protected onDeleteFile() {
    const modalRef = this.modalService.open(ConfirmRemoveComponent);
    modalRef.componentInstance.names = [this.document()?.name];
    race(modalRef.closed, modalRef.dismissed)
      .pipe(
        take(1),
        exhaustMap((result) => {
          if (result === 'DELETE') {
            this.delete.emit();
          }
          return EMPTY;
        }),
        takeUntil(this.drop),
      )
      .subscribe({});
  }
}
