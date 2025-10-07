import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryBatchComponent } from './history-batch.component';

describe('HistoryBatchComponent', () => {
  let component: HistoryBatchComponent;
  let fixture: ComponentFixture<HistoryBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
