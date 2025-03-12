import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { DynamicDocumentManagerComponent } from "./dynamic-document-manager/dynamic-document-manager.component";

@Component({
  selector: "app-root",
  template: `
    <h1>If you like a challenge, then here's a problem for you :)</h1>
    <h2>Problem reproduction steps</h2>
    <p>
      <br />
      1. open console log
      <br />
      2. click the three buttons on the right of any item except the first one
      <br />
      3. click the "Replace file" button
      <br />
      4. compare the fileUuid that you expected with the one that you've got
      <br />
      5. get confused 🥲
    </p>
    <scs-dynamic-document-manager [entityId]="'meow'" [entityType]="'site'" />
  `,
  imports: [DynamicDocumentManagerComponent],
})
export class App {
  name = "Angular";
}

bootstrapApplication(App);
