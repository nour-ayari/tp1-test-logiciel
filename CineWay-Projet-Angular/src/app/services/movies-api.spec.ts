import { TestBed } from '@angular/core/testing';

import { MoviesApi } from './movies-api';

describe('MoviesApi', () => {
  let service: MoviesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoviesApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
