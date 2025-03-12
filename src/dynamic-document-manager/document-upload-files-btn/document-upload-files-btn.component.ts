import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'scs-document-upload-files-btn',
  imports: [CommonModule],
  templateUrl: './document-upload-files-btn.component.html',
  styleUrl: './document-upload-files-btn.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentUploadFilesBtnComponent {
  public readonly file = output<File>();

  protected fileSelectHandler(e: any) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target?.files?.[0] || e.dataTransfer.files[0];
    this.file.emit(file);
    e.target.value = null;
  }
}
