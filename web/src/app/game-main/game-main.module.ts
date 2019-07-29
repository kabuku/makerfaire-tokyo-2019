import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameMainRoutingModule } from './game-main-routing.module';
import { MainPageComponent } from './containers/main-page.component';
import {MainComponent} from './components/main.component';
import { SceneComponent } from './components/scene.component';
import {MaterialModule} from '../material/material.module';
import {ReactiveFormsModule} from '@angular/forms';
import { SettingFormComponent } from './components/setting-form.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import { SettingFormDialogComponent } from './components/setting-form-dialog.component';
import { PrepareComponent } from './components/prepare.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [MainPageComponent, MainComponent, SceneComponent, SettingFormComponent, SettingFormDialogComponent, PrepareComponent],
  imports: [
    CommonModule,
    GameMainRoutingModule,
    MaterialModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    HttpClientModule
  ],
  entryComponents: [SettingFormDialogComponent]
})
export class GameMainModule { }
