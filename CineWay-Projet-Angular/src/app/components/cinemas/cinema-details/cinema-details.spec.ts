import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CinemaDetails } from './cinema-details';

describe('CinemaDetails', () => {
  let component: CinemaDetails;
  let fixture: ComponentFixture<CinemaDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CinemaDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CinemaDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
