import { Action, createReducer, on, createFeatureSelector } from '@ngrx/store';
import * as ExampleActions from './actions';

export const featureName = 'example';

export interface State {

}

export const initialState: State = {

};

export const selectExampleState = createFeatureSelector<State>('featureName');

const reducers = createReducer(
  initialState,

  on(ExampleActions.loadExamples, state => state),

);

export function reducer(state: State | undefined, action: Action) {
  return reducers(state, action);
}
