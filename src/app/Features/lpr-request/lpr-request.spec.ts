import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LprRequest } from './lpr-request';

describe('LprRequest', () => {
  let component: LprRequest;
  let fixture: ComponentFixture<LprRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LprRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LprRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
