import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsBatchComponent } from './details-batch.component';

describe('DetailsBatchComponent', () => {
  let component: DetailsBatchComponent;
  let fixture: ComponentFixture<DetailsBatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsBatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsBatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
