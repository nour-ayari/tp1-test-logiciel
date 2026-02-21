import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShowtimeSelectionComponent } from './showtime-selection';

describe('ShowtimeSelectionComponent', () => {
  let component: ShowtimeSelectionComponent;
  let fixture: ComponentFixture<ShowtimeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowtimeSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShowtimeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
