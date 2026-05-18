import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceModal } from './device-modal';

describe('DeviceModal', () => {
  let component: DeviceModal;
  let fixture: ComponentFixture<DeviceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
