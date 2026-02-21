import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowtimeSidebar } from './showtime-sidebar';

describe('ShowtimeSidebar', () => {
  let component: ShowtimeSidebar;
  let fixture: ComponentFixture<ShowtimeSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowtimeSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowtimeSidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
