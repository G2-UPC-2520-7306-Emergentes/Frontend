import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoverLoginComponent } from './recover-login.component';

describe('RecoverLoginComponent', () => {
  let component: RecoverLoginComponent;
  let fixture: ComponentFixture<RecoverLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoverLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecoverLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
