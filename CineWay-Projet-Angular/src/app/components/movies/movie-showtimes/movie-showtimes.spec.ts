import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieShowtimesComponent } from './movie-showtimes';

describe('MovieShowtimesComponent', () => {
  let component: MovieShowtimesComponent;
  let fixture: ComponentFixture<MovieShowtimesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieShowtimesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieShowtimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
