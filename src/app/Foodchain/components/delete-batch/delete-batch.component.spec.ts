import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteBatchComponent } from './delete-batch.component';

describe('DeleteBatchComponent', () => {
  let component: DeleteBatchComponent;
  let fixture: ComponentFixture<DeleteBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
