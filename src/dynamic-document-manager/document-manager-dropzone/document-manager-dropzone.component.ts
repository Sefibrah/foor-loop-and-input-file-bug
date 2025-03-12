import { ChangeDetectionStrategy, Component, ElementRef, HostListener, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'scs-document-manager-dropzone',
  imports: [CommonModule],
  templateUrl: './document-manager-dropzone.component.html',
  styleUrl: './document-manager-dropzone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentManagerDropzoneComponent {
  public readonly file = output<File>();

  private readonly dropzone = viewChild<ElementRef<HTMLLabelElement>>('dropzone');

  @HostListener('window:dragover', ['$event'])
  // @ts-ignore
  private windowDragover(event: KeyboardEvent) {
    this.dropzoneHover(event);
  }

  /**
   * This method is just trying to add the the `hover` class to the `dropzone` element.
   *
   * It's used by the regular dropzone element in HTML and the window object itself!
   *
   * With that context in mind, this method is sort of an all-in-one method accomodating to all...
   *
   * If for some reason you need a 4th element to modify the dropzone's hover class
   * then consider changing this method, or creating a new one, or something else entirely!
   */
  protected dropzoneHover(e: Event): void {
    e.stopPropagation();
    e.preventDefault();

    if (e.type === 'dragover') {
      this.dropzone()?.nativeElement.classList.add('dropzone--hovered');
    } else if (e.type === 'dragleave') {
      this.dropzone()?.nativeElement.classList.remove('dropzone--hovered');
    }
  }

  protected fileSelectHandler(e: any) {
    e.preventDefault();
    const file = e.target?.files?.[0] || e.dataTransfer.files[0];
    this.dropzone()?.nativeElement?.classList.remove('dropzone--hovered');
    this.file.emit(file);
  }
}
