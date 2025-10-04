import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicateBatchComponent } from './duplicate-batch.component';

describe('DuplicateBatchComponent', () => {
  let component: DuplicateBatchComponent;
  let fixture: ComponentFixture<DuplicateBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuplicateBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicateBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
