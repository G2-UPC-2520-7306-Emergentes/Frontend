import { ComponentFixture, TestBed } from '@angular/core/testing';
import {AuthorizeStepComponent} from './authorize-step.component';



describe('AuthorizeStepComponent', () => {
  let component: AuthorizeStepComponent;
  let fixture: ComponentFixture<AuthorizeStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizeStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthorizeStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
