import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import * as fromExample from './reducers';
import { EffectsModule } from '@ngrx/effects';
import { Effects } from './effects';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(fromExample.featureName, fromExample.reducer),
    EffectsModule.forFeature([Effects])
  ]
})
export class ExampleModule { }
