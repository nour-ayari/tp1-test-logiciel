import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CinemaCard } from './cinema-card';

describe('CinemaCard', () => {
  let component: CinemaCard;
  let fixture: ComponentFixture<CinemaCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CinemaCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CinemaCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
