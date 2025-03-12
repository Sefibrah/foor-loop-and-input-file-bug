import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { DynamicDocumentManagerComponent } from "./dynamic-document-manager/dynamic-document-manager.component";

@Component({
  selector: "app-root",
  template: `
    <h1>Hello from {{ name }}!</h1>
    <a target="_blank" href="https://angular.dev/overview"> Learn more about Angular </a>
    <scs-dynamic-document-manager [entityId]="'meow'" [entityType]="'site'" />
  `,
  imports: [DynamicDocumentManagerComponent],
})
export class App {
  name = "Angular";
}

bootstrapApplication(App);
