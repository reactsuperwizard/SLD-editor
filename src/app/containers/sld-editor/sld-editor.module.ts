import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { NgxMaskModule } from 'ngx-mask';

import { DialogDirective } from './directives/dialog.directive';

import { SldEditorComponent } from './sld-editor.component';
import { SldUtilService } from './services/util.service';
import { DiagramComponent } from './diagram/diagram.component';
import { PaletteComponent } from './palette/palette.component';
import { MenuBarComponent } from './menu-bar/menu-bar.component';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { MetadataDialogComponent } from './metadata-dialog/metadata-dialog.component';
import { NameDialogComponent } from './name-dialog/name-dialog.component';
import { SearchComponent } from './search/search.component';
import { EditAreaDialogComponent } from './edit-area-dialog/edit-area-dialog.component';
import { StaticContentDialogComponent } from './static-content-dialog/static-content-dialog.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        RouterModule.forRoot([]),
        HttpClientModule,
        NgxMaskModule.forRoot()
    ],
    declarations: [
        SldEditorComponent,
        DiagramComponent,
        PaletteComponent,
        MenuBarComponent,
        ContextMenuComponent,
        MetadataDialogComponent,
        NameDialogComponent,
        SearchComponent,
        EditAreaDialogComponent,
        StaticContentDialogComponent,
        HeaderComponent,

        DialogDirective
    ],
    providers: [
        SldUtilService
    ],
    exports: [
      SldEditorComponent
    ]
})
export class SldEditorModule { }
