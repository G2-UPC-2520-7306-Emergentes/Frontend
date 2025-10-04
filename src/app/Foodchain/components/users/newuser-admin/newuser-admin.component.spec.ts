import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewuserAdminComponent } from './newuser-admin.component';

describe('NewuserAdminComponent', () => {
  let component: NewuserAdminComponent;
  let fixture: ComponentFixture<NewuserAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewuserAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewuserAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
