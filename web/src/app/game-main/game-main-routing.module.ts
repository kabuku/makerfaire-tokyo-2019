import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MainPageComponent} from './containers/main-page.component';
import {AssetsResolveService} from './services/assets-resolve.service';


const routes: Routes = [{
  path: '',
  component: MainPageComponent,
  resolve: {
    assets: AssetsResolveService
  }
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameMainRoutingModule { }
