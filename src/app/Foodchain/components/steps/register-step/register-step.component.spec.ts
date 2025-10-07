import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterStepComponent } from './register-step.component';

describe('RegisterStepComponent', () => {
  let component: RegisterStepComponent;
  let fixture: ComponentFixture<RegisterStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
