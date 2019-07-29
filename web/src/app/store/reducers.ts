import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../../environments/environment';

export interface Reducers {

}

export const reducers: ActionReducerMap<Reducers> = {

};


export const metaReducers: MetaReducer<Reducers>[] = !environment.production ? [] : [];
